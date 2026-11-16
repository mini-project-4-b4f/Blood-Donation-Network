import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BloodType, Prisma, RequestStatus, Urgency } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { AreasService } from '../areas/areas.service';
import { MatchingService } from '../matching/matching.service';
import { AppLogger } from '../common/app-logger.service';
import {
  toApiBloodType,
  toPrismaBloodType,
  normalizePatientRef,
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

  private mapRequest<T extends { bloodType: BloodType }>(request: T) {
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

    const duplicateRequest = await this.prisma.bloodRequest.findFirst({
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

    const request = await this.prisma.bloodRequest.create({
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
      include: {
        area: true,
      },
    });

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
        donationDate: donation.donationDate,
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
    const existingRequest = await this.prisma.bloodRequest.findUnique({
      where: { id },
    });

    if (!existingRequest) {
      throw new NotFoundException('Blood request not found.');
    }

    if (existingRequest.status !== RequestStatus.OPEN) {
      throw new ConflictException('Only OPEN requests can be updated.');
    }

    if (
      dto.unitsRequired !== undefined &&
      dto.unitsRequired < existingRequest.unitsCollected
    ) {
      throw new BadRequestException(
        'Units required cannot be reduced below the units already collected.',
      );
    }

    const updatedRequest = await this.prisma.$transaction(async (tx) => {
      const unitsRequired = dto.unitsRequired ?? existingRequest.unitsRequired;

      const shouldFulfill =
        existingRequest.unitsCollected > 0 &&
        unitsRequired === existingRequest.unitsCollected;

      const request = await tx.bloodRequest.update({
        where: { id },
        data: {
          unitsRequired: dto.unitsRequired,
          urgency: dto.urgency as Urgency | undefined,
          note: dto.note,
          ...(shouldFulfill && {
            status: RequestStatus.FULFILLED,
          }),
        },
        include: {
          area: true,
        },
      });

      if (shouldFulfill) {
        await tx.pledge.updateMany({
          where: {
            requestId: id,
            status: 'PLEDGED',
          },
          data: {
            status: 'RELEASED',
          },
        });
      }

      return {
        request,
        fulfilled: shouldFulfill,
      };
    });

    if (updatedRequest.fulfilled) {
      this.logger.logRequestFulfilled(id);
    }

    return this.findRequestById(id);
  }

  async cancelRequest(id: string, dto: CancelRequestDto) {
    const existingRequest = await this.prisma.bloodRequest.findUnique({
      where: { id },
    });

    if (!existingRequest) {
      throw new NotFoundException('Blood request not found.');
    }

    if (existingRequest.status !== RequestStatus.OPEN) {
      throw new ConflictException('Only OPEN requests can be cancelled.');
    }

    const request = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.bloodRequest.updateMany({
        where: { id, status: RequestStatus.OPEN },
        data: {
          status: RequestStatus.CANCELLED,
          cancelReason: dto.cancelReason,
        },
      });

      if (updated.count !== 1) {
        throw new ConflictException('Only OPEN requests can be cancelled.');
      }

      await tx.pledge.updateMany({
        where: { requestId: id, status: 'PLEDGED' },
        data: { status: 'RELEASED' },
      });

      return tx.bloodRequest.findUniqueOrThrow({
        where: { id },
        include: { area: true },
      });
    });

    this.logger.logRequestCancelled(id, dto.cancelReason);

    return this.findRequestById(id);
  }

  async getEligibleDonors(id: string) {
    return this.matchingService.getEligibleDonorsForRequest(id);
  }
}
