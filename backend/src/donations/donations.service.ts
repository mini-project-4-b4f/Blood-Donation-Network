import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PledgeStatus, RequestStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { MatchingService } from '../matching/matching.service';
import { ClockService } from '../common/clock.service';
import { AppLogger } from '../common/app-logger.service';
import { toApiBloodType, toDateOnlyString } from '../common/normalize.util';

import { RecordDonationDto } from './dto/record-donation.dto';

@Injectable()
export class DonationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly matchingService: MatchingService,
    private readonly clock: ClockService,
    private readonly logger: AppLogger,
  ) {}

  async recordDonation(
    requestId: string,
    coordinatorId: string,
    dto: RecordDonationDto,
  ) {
    const now = this.clock.now();

    const request = await this.prisma.bloodRequest.findUnique({
      where: { id: requestId },
      include: { area: true },
    });

    if (!request) {
      throw new NotFoundException('Blood request not found.');
    }

    if (request.status !== RequestStatus.OPEN) {
      throw new ConflictException(
        'Donations can only be recorded for OPEN requests.',
      );
    }

    const today = toDateOnlyString(now);

    if (dto.donationDate > today) {
      throw new BadRequestException(
        'The donation date cannot be in the future.',
      );
    }

    const donor = await this.prisma.donorProfile.findUnique({
      where: { id: dto.donorId },
      include: {
        user: true,
        area: true,
      },
    });

    if (!donor) {
      throw new NotFoundException('Donor not found.');
    }

    const eligibility = this.matchingService.checkDonorEligibilityForRequest(
      donor,
      request,
      now,
    );

    if (eligibility.eligible === false) {
      this.logger.warnDonationRejected(
        requestId,
        donor.id,
        eligibility.forCoordinator,
      );

      throw new BadRequestException(eligibility.forCoordinator);
    }

    const donationDate = new Date(`${dto.donationDate}T00:00:00.000Z`);

    const result = await this.prisma.$transaction(async (tx) => {
      // Recheck the request inside the transaction.
      const currentRequest = await tx.bloodRequest.findUnique({
        where: { id: requestId },
      });

      if (!currentRequest) {
        throw new NotFoundException('Blood request not found.');
      }

      if (currentRequest.status !== RequestStatus.OPEN) {
        throw new ConflictException(
          'Donations can only be recorded for OPEN requests.',
        );
      }

      // Re-read donor state in the transaction so eligibility is not based on
      // a stale profile or last-donation date.
      const currentDonor = await tx.donorProfile.findUnique({
        where: { id: dto.donorId },
        include: { user: true, area: true },
      });

      if (!currentDonor) {
        throw new NotFoundException('Donor not found.');
      }

      const currentEligibility = this.matchingService.checkDonorEligibilityForRequest(
        currentDonor,
        currentRequest,
        now,
      );

      if (!currentEligibility.eligible) {
        throw new BadRequestException(currentEligibility.forCoordinator);
      }

      // Atomically reserve one unit without exceeding the required units.
      const requestUpdate = await tx.bloodRequest.updateMany({
        where: {
          id: requestId,
          status: RequestStatus.OPEN,
          unitsRequired: currentRequest.unitsRequired,
          unitsCollected: {
            lt: currentRequest.unitsRequired,
          },
        },
        data: {
          unitsCollected: {
            increment: 1,
          },
        },
      });

      if (requestUpdate.count !== 1) {
        throw new ConflictException(
          'Donations can only be recorded for OPEN requests.',
        );
      }

      const progressRequest = await tx.bloodRequest.findUniqueOrThrow({
        where: { id: requestId },
      });

      // Prevent a concurrent donation from updating the same donor
      // using an outdated lastDonationDate.
      const latestDonationDate =
        !currentDonor.lastDonationDate || donationDate > currentDonor.lastDonationDate
          ? donationDate
          : currentDonor.lastDonationDate;

      const donorUpdate = await tx.donorProfile.updateMany({
        where: {
          id: currentDonor.id,
          isAvailable: true,
          lastDonationDate: currentDonor.lastDonationDate,
        },
        data: {
          lastDonationDate: latestDonationDate,
        },
      });

      if (donorUpdate.count !== 1) {
        throw new ConflictException(
          'Donor eligibility changed. Please check eligibility again.',
        );
      }

      const donation = await tx.donation.create({
        data: {
          donorId: currentDonor.id,
          requestId,
          recordedById: coordinatorId,
          donationDate,
          units: 1,
        },
      });

      // Complete this donor's active pledge for this request.
      await tx.pledge.updateMany({
        where: {
          donorId: currentDonor.id,
          requestId,
          status: PledgeStatus.PLEDGED,
        },
        data: {
          status: PledgeStatus.COMPLETED,
        },
      });

      const fulfilled =
        progressRequest.unitsCollected >= progressRequest.unitsRequired;

      if (fulfilled) {
        await tx.bloodRequest.update({
          where: { id: requestId },
          data: {
            status: RequestStatus.FULFILLED,
          },
        });

        // Release all remaining active pledges.
        await tx.pledge.updateMany({
          where: {
            requestId,
            status: PledgeStatus.PLEDGED,
          },
          data: {
            status: PledgeStatus.RELEASED,
          },
        });
      }

      const updatedRequest = await tx.bloodRequest.findUniqueOrThrow({
        where: { id: requestId },
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

      return {
        donation,
        fulfilled,
        request: updatedRequest,
      };
    });

    // Log only after the transaction succeeds.
    this.logger.logDonationRecorded(result.donation.id, requestId, dto.donorId);

    if (result.fulfilled) {
      this.logger.logRequestFulfilled(requestId);
    }


    const requestDetails = result.request;
    return {
      ...requestDetails,
      bloodType: toApiBloodType(requestDetails.bloodType),
      unitsStillNeeded: Math.max(0, requestDetails.unitsRequired - requestDetails.unitsCollected),
      activePledgesCount: requestDetails.pledges.filter((pledge) => pledge.status === PledgeStatus.PLEDGED).length,
      pledges: requestDetails.pledges.map((pledge) => ({
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
      donations: requestDetails.donations.map((donationItem) => ({
        id: donationItem.id,
        donationDate: donationItem.donationDate,
        units: donationItem.units,
        createdAt: donationItem.createdAt,
        donor: {
          id: donationItem.donor.id,
          fullName: donationItem.donor.fullName,
          phone: donationItem.donor.user.phone,
          bloodType: toApiBloodType(donationItem.donor.bloodType),
        },
        recordedBy: donationItem.recordedBy,
      })),
    };
  }
}
