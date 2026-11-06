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
      orderBy: [{ urgency: 'asc' }, { createdAt: 'desc' }],
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

    const request = await this.prisma.bloodRequest.create({
      data: {
        patientReference: normalizePatientRef(dto.patientReference),
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

    return this.mapRequest(request);
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
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return requests.map((request) => this.mapRequest(request));
  }

  async findRequestById(id: string) {
    const request = await this.prisma.bloodRequest.findUnique({
      where: { id },
      include: {
        area: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Blood request not found.');
    }

    return this.mapRequest(request);
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

    return this.mapRequest(updatedRequest.request);
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

    const request = await this.prisma.bloodRequest.update({
      where: { id },
      data: {
        status: RequestStatus.CANCELLED,
        cancelReason: dto.cancelReason,
      },
      include: {
        area: true,
      },
    });

    this.logger.logRequestCancelled(id, dto.cancelReason);

    return this.mapRequest(request);
  }

  async getEligibleDonors(id: string) {
    return this.matchingService.getEligibleDonorsForRequest(id);
  }
}
