import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PledgeStatus,
  Prisma,
  RequestStatus,
} from '@prisma/client';
import { MatchingService } from '../matching/matching.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  DonorActivePledge,
} from '../donors/donors.types';
import { ClockService } from '../common/clock.service';
import { toApiBloodType } from '../common/normalize.util';

@Injectable()
export class PledgesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly matchingService: MatchingService,
    private readonly clock: ClockService,
  ) {}

  async createPledge(
    requestId: string,
    userId: string,
  ): Promise<DonorActivePledge> {
    for (let attempt = 0; ; attempt += 1) {
      try {
        return await this.prisma.$transaction(
          async (tx) => {
            const request = await tx.bloodRequest.findUnique({
              where: { id: requestId },
              include: { area: { select: { id: true, name: true } } },
            });
            if (!request) {
              throw new NotFoundException('Blood request not found.');
            }
            if (request.status !== RequestStatus.OPEN) {
              throw new ConflictException(
                'Pledges can only be made for OPEN requests.',
              );
            }

            const activePledge = await tx.pledge.findFirst({
              where: {
                status: PledgeStatus.PLEDGED,
                donor: { is: { userId } },
              },
              select: { id: true },
            });
            if (activePledge) {
              throw new ConflictException(
                'You already have an active pledge. You can hold at most one active pledge at a time.',
              );
            }

            const donor = await tx.donorProfile.findUnique({
              where: { userId },
              include: {
                user: { select: { isActive: true } },
                area: { select: { id: true, name: true } },
              },
            });
            if (!donor) throw new NotFoundException('Donor not found.');

            const eligibility =
              this.matchingService.checkDonorEligibilityForRequest(
                donor,
                request,
                this.clock.now(),
              );
            if (!eligibility.eligible) {
              throw new BadRequestException(eligibility.forDonor);
            }

            const activePledgesCount = await tx.pledge.count({
              where: { requestId, status: PledgeStatus.PLEDGED },
            });
            const unitsStillNeeded = Math.max(
              0,
              request.unitsRequired - request.unitsCollected,
            );
            if (activePledgesCount >= unitsStillNeeded) {
              throw new ConflictException(
                'This request already has enough active pledges for all remaining units needed.',
              );
            }

            const pledge = await tx.pledge.create({
              data: {
                donorId: donor.id,
                requestId: request.id,
                status: PledgeStatus.PLEDGED,
              },
              include: {
                request: {
                  include: {
                    area: { select: { id: true, name: true } },
                  },
                },
              },
            });

            return this.toDonorActivePledge(pledge);
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
      } catch (error) {
        const isSerializationConflict =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2034';
        if (isSerializationConflict && attempt < 2) continue;
        throw error;
      }
    }
  }

  async withdrawPledge(
    pledgeId: string,
    userId: string,
  ): Promise<{ id: string; status: PledgeStatus.WITHDRAWN }> {
    return this.prisma.$transaction(async (tx) => {
      const pledge = await tx.pledge.findUnique({
        where: { id: pledgeId },
        include: { donor: { select: { userId: true } } },
      });
      if (!pledge) throw new NotFoundException('Pledge not found.');
      if (pledge.donor.userId !== userId) {
        throw new ForbiddenException('You can only withdraw your own pledge.');
      }
      if (pledge.status !== PledgeStatus.PLEDGED) {
        throw new ConflictException(
          'Only active PLEDGED pledges can be withdrawn.',
        );
      }

      const result = await tx.pledge.updateMany({
        where: {
          id: pledge.id,
          donorId: pledge.donorId,
          status: PledgeStatus.PLEDGED,
        },
        data: { status: PledgeStatus.WITHDRAWN },
      });
      if (result.count !== 1) {
        throw new ConflictException(
          'Only active PLEDGED pledges can be withdrawn.',
        );
      }

      return { id: pledge.id, status: PledgeStatus.WITHDRAWN };
    });
  }

  private toDonorActivePledge(
    pledge: Prisma.PledgeGetPayload<{
      include: {
        request: {
          include: {
            area: { select: { id: true; name: true } };
          };
        };
      };
    }>,
  ): DonorActivePledge {
    const { request } = pledge;
    return {
      id: pledge.id,
      status: pledge.status,
      createdAt: pledge.createdAt.toISOString(),
      request: {
        id: request.id,
        bloodType: toApiBloodType(request.bloodType),
        area: { id: request.area.id, name: request.area.name },
        urgency: request.urgency,
        hospital: request.hospital,
        unitsRequired: request.unitsRequired,
        unitsCollected: request.unitsCollected,
        unitsStillNeeded: Math.max(
          0,
          request.unitsRequired - request.unitsCollected,
        ),
        status: request.status,
      },
    };
  }
}
