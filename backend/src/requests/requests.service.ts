import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BloodType, PledgeStatus, Prisma, RequestStatus, Urgency } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { AreasService } from '../areas/areas.service';
import { MatchingService } from '../matching/matching.service';
import { AppLogger } from '../common/app-logger.service';
import {
  toApiBloodType,
  toPrismaBloodType,
  normalizePatientRef,
  toDateOnlyString,
} from '../common/normalize.util';
import { ApiBloodType } from '../common/constants';

import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { CancelRequestDto } from './dto/cancel-request.dto';
import { RequestFiltersQueryDto } from './dto/request-filters-query.dto';

@Injectable()
export class RequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly areasService: AreasService,
    private readonly matchingService: MatchingService,
    private readonly logger: AppLogger,
  ) {}

  private mapRequest<T extends { bloodType: BloodType }>(
  request: T,
): Omit<T, 'bloodType'> & {
  bloodType: ReturnType<typeof toApiBloodType>;
} {
  return {
    ...request,
    bloodType: toApiBloodType(request.bloodType),
  };
}

  async getPublicSosRequests() {
    const requests = await this.prisma.bloodRequest.findMany({
      where: {
        status: RequestStatus.OPEN,
      },
      select: {
        id: true,
        bloodType: true,
        urgency: true,
        hospital: true,
        createdAt: true,
        unitsRequired: true,
        unitsCollected: true,
        area: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ urgency: 'asc' }, { createdAt: 'asc' }],
    });

    return requests.map((request) => ({
      id: request.id,
      bloodType: toApiBloodType(request.bloodType),
      area: request.area,
      urgency: request.urgency,
      hospital: request.hospital,
      unitsStillNeeded: Math.max(
        0,
        request.unitsRequired - request.unitsCollected,
      ),
      createdAt: request.createdAt,
    }));
  }

  async createRequest(coordinatorId: string, dto: CreateRequestDto) {
    const area = await this.areasService.findByIdOrThrow(dto.areaId);
    const patientReference = normalizePatientRef(dto.patientReference);
    let request: Prisma.BloodRequestGetPayload<{ include: { area: true } }>;

    for (let attempt = 0; ; attempt += 1) {
      try {
        request = await this.prisma.$transaction(
          async (tx) => {
            const duplicateRequest = await tx.bloodRequest.findFirst({
              where: {
                patientReference: { equals: patientReference, mode: 'insensitive' },
                bloodType: toPrismaBloodType(dto.bloodType as ApiBloodType),
                status: RequestStatus.OPEN,
              },
              select: { id: true },
            });

            if (duplicateRequest) {
              throw new ConflictException(
                'An open request for this patient reference and blood type already exists.',
              );
            }

            return tx.bloodRequest.create({
              data: {
                patientReference,
                bloodType: toPrismaBloodType(dto.bloodType as ApiBloodType),
                unitsRequired: dto.unitsRequired,
                areaId: area.id,
                urgency: dto.urgency as Urgency,
                hospital: dto.hospital,
                note: dto.note,
                createdById: coordinatorId,
              },
              include: { area: true },
            });
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
        break;
      } catch (error) {
        const isSerializationConflict =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2034';
        if (isSerializationConflict && attempt < 2) continue;
        throw error;
      }
    }

    this.logger.logRequestCreated(
      request.id,
      toApiBloodType(request.bloodType),
      request.unitsRequired,
      request.area.name,
      request.urgency,
    );

    return this.findRequestById(request.id);
  }

  async findAllRequests(filters: RequestFiltersQueryDto) {
    const where: Prisma.BloodRequestWhereInput = {
      ...(filters.status && {
        status: filters.status as RequestStatus,
      }),
      ...(filters.bloodType && {
        bloodType: toPrismaBloodType(filters.bloodType as ApiBloodType),
      }),
      ...(filters.areaId && {
        areaId: filters.areaId,
      }),
      ...(filters.urgency && {
        urgency: filters.urgency as Urgency,
      }),
    };

    const requests = await this.prisma.bloodRequest.findMany({
      where,
      include: {
        area: true,
        pledges: {
          where: { status: 'PLEDGED' },
          select: { id: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return requests.map(({ pledges, ...request }) => ({
      ...this.mapRequest(request),
      unitsStillNeeded: Math.max(0, request.unitsRequired - request.unitsCollected),
      activePledgesCount: pledges.length,
    }));
  }

  async findRequestById(id: string) {
    const request = await this.prisma.bloodRequest.findUnique({
      where: { id },
      include: {
        area: true,
        pledges: {
          orderBy: { createdAt: 'desc' },
          include: {
            donor: {
              include: {
                user: { select: { phone: true } },
                area: true,
              },
            },
          },
        },
        donations: {
          orderBy: { donationDate: 'desc' },
          include: {
            donor: {
              include: { user: { select: { phone: true } } },
            },
            recordedBy: { select: { id: true, phone: true, email: true } },
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Blood request not found.');
    }

    return {
      ...this.mapRequest(request),
      unitsStillNeeded: Math.max(0, request.unitsRequired - request.unitsCollected),
      activePledgesCount: request.pledges.filter((pledge) => pledge.status === 'PLEDGED').length,
      pledges: request.pledges.map((pledge) => ({
        id: pledge.id,
        status: pledge.status,
        createdAt: pledge.createdAt,
        donor: {
          id: pledge.donor.id,
          fullName: pledge.donor.fullName,
          phone: pledge.donor.user.phone,
          bloodType: toApiBloodType(pledge.donor.bloodType),
          area: pledge.donor.area,
        },
      })),
      donations: request.donations.map((donation) => ({
        id: donation.id,
        donationDate: toDateOnlyString(donation.donationDate),
        units: donation.units,
        createdAt: donation.createdAt,
        donor: {
          id: donation.donor.id,
          fullName: donation.donor.fullName,
          phone: donation.donor.user.phone,
          bloodType: toApiBloodType(donation.donor.bloodType),
        },
        recordedBy: donation.recordedBy,
      })),
    };
  }

  async updateRequest(id: string, dto: UpdateRequestDto) {
    let updatedRequest: { fulfilled: boolean };

    for (let attempt = 0; ; attempt += 1) {
      try {
        updatedRequest = await this.prisma.$transaction(
          async (tx) => {
            const currentRequest = await tx.bloodRequest.findUnique({
              where: { id },
            });

            if (!currentRequest) {
              throw new NotFoundException('Blood request not found.');
            }

            if (currentRequest.status !== RequestStatus.OPEN) {
              throw new ConflictException('Only OPEN requests can be updated.');
            }

            const unitsRequired = dto.unitsRequired ?? currentRequest.unitsRequired;
            if (unitsRequired < currentRequest.unitsCollected) {
              throw new BadRequestException(
                'Units required cannot be reduced below the units already collected.',
              );
            }

            const shouldFulfill =
              currentRequest.unitsCollected > 0 &&
              unitsRequired === currentRequest.unitsCollected;

            const update = await tx.bloodRequest.updateMany({
              where: {
                id,
                status: RequestStatus.OPEN,
                unitsCollected: currentRequest.unitsCollected,
                unitsRequired: currentRequest.unitsRequired,
              },
              data: {
                unitsRequired: dto.unitsRequired,
                urgency: dto.urgency as Urgency | undefined,
                note: dto.note,
                ...(shouldFulfill && { status: RequestStatus.FULFILLED }),
              },
            });

            if (update.count !== 1) {
              throw new ConflictException(
                'The request changed while it was being updated. Please try again.',
              );
            }

            // Keep active pledges within the remaining unit capacity. If the
            // coordinator reduces required units, retain the oldest pledges.
            const unitsStillNeeded = Math.max(
              0,
              unitsRequired - currentRequest.unitsCollected,
            );
            const activePledges = await tx.pledge.findMany({
              where: { requestId: id, status: PledgeStatus.PLEDGED },
              orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
              select: { id: true },
            });

            const excessPledgeIds = activePledges
              .slice(unitsStillNeeded)
              .map((pledge) => pledge.id);

            if (excessPledgeIds.length > 0) {
              await tx.pledge.updateMany({
                where: {
                  id: { in: excessPledgeIds },
                  status: PledgeStatus.PLEDGED,
                },
                data: { status: PledgeStatus.RELEASED },
              });
            }

            return { fulfilled: shouldFulfill };
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
        break;
      } catch (error) {
        const isSerializationConflict =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2034';
        if (isSerializationConflict && attempt < 2) continue;
        throw error;
      }
    }

    if (updatedRequest.fulfilled) {
      this.logger.logRequestFulfilled(id);
    }

    return this.findRequestById(id);
  }

  async cancelRequest(id: string, dto: CancelRequestDto) {
    let cancelled = false;

    for (let attempt = 0; ; attempt += 1) {
      try {
        await this.prisma.$transaction(
          async (tx) => {
            const updated = await tx.bloodRequest.updateMany({
              where: { id, status: RequestStatus.OPEN },
              data: {
                status: RequestStatus.CANCELLED,
                cancelReason: dto.cancelReason,
              },
            });

            if (updated.count !== 1) {
              const exists = await tx.bloodRequest.findUnique({
                where: { id },
                select: { id: true },
              });
              if (!exists) {
                throw new NotFoundException('Blood request not found.');
              }
              throw new ConflictException('Only OPEN requests can be cancelled.');
            }

            await tx.pledge.updateMany({
              where: { requestId: id, status: PledgeStatus.PLEDGED },
              data: { status: PledgeStatus.RELEASED },
            });
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
        cancelled = true;
        break;
      } catch (error) {
        const isSerializationConflict =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2034';
        if (isSerializationConflict && attempt < 2) continue;
        throw error;
      }
    }

    if (cancelled) {
      this.logger.logRequestCancelled(id, dto.cancelReason);
    }

    return this.findRequestById(id);
  }

  async getEligibleDonors(id: string) {
    return this.matchingService.getEligibleDonorsForRequest(id);
  }
}
