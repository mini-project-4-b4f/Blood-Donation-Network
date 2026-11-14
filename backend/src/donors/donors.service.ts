import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PledgeStatus,
  Prisma,
  RequestStatus,
} from '@prisma/client';
import { AreasService } from '../areas/areas.service';
import { ClockService } from '../common/clock.service';
import { URGENCY_SORT_ORDER } from '../common/constants';
import {
  normalizePhone,
  toApiBloodType,
  toDateOnlyString,
} from '../common/normalize.util';
import { MatchingService } from '../matching/matching.service';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateDonorProfileDto } from './dto/update-donor-profile.dto';
import {
  CoordinatorDonorItem,
  DonorDashboardProfile,
  DonorDonationHistoryItem,
  DonorActivePledge,
  EligibleOpenRequest,
} from './donors.types';

const dashboardDonorInclude = {
  user: {
    select: { phone: true, email: true, isActive: true },
  },
  area: {
    select: { id: true, name: true },
  },
  pledges: {
    where: { status: PledgeStatus.PLEDGED },
    orderBy: { createdAt: 'desc' },
    take: 1,
    include: {
      request: {
        include: {
          area: { select: { id: true, name: true } },
        },
      },
    },
  },
  donations: {
    orderBy: { donationDate: 'desc' },
    include: {
      request: {
        include: {
          area: { select: { id: true, name: true } },
        },
      },
    },
  },
} satisfies Prisma.DonorProfileInclude;

type DashboardDonor = Prisma.DonorProfileGetPayload<{
  include: typeof dashboardDonorInclude;
}>;

@Injectable()
export class DonorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly areasService: AreasService,
    private readonly matchingService: MatchingService,
    private readonly clock: ClockService,
  ) {}

  async getMyProfile(userId: string): Promise<DonorDashboardProfile> {
    const donor = await this.prisma.donorProfile.findUnique({
      where: { userId },
      include: dashboardDonorInclude,
    });
    if (!donor) throw new NotFoundException('Donor not found.');

    return this.toDashboardProfile(donor);
  }

  async updateMyProfile(
    userId: string,
    dto: UpdateDonorProfileDto,
  ): Promise<DonorDashboardProfile> {
    const donor = await this.prisma.donorProfile.findUnique({
      where: { userId },
      select: { id: true, userId: true },
    });
    if (!donor) throw new NotFoundException('Donor not found.');

    if (dto.areaId !== undefined) {
      await this.areasService.findByIdOrThrow(dto.areaId);
    }

    const phone = dto.phone === undefined ? undefined : normalizePhone(dto.phone);
    if (phone !== undefined) {
      const existingUser = await this.prisma.user.findFirst({
        where: { phone, id: { not: userId } },
        select: { id: true },
      });
      if (existingUser) {
        throw new ConflictException(
          'An account with this phone number is already registered.',
        );
      }
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        if (phone !== undefined) {
          await tx.user.update({
            where: { id: userId },
            data: { phone },
          });
        }

        if (dto.areaId !== undefined || dto.isAvailable !== undefined) {
          await tx.donorProfile.update({
            where: { id: donor.id },
            data: {
              areaId: dto.areaId,
              isAvailable: dto.isAvailable,
            },
          });
        }
      });
    } catch (error) {
      if (
        phone !== undefined &&
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'An account with this phone number is already registered.',
        );
      }
      throw error;
    }

    return this.getMyProfile(userId);
  }

  async deactivateMyAccount(
    userId: string,
  ): Promise<{ message: string }> {
    const donor = await this.prisma.donorProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!donor) throw new NotFoundException('Donor not found.');

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { isActive: false },
      }),
      this.prisma.donorProfile.update({
        where: { id: donor.id },
        data: { isAvailable: false },
      }),
      this.prisma.pledge.updateMany({
        where: { donorId: donor.id, status: PledgeStatus.PLEDGED },
        data: { status: PledgeStatus.WITHDRAWN },
      }),
    ]);

    return { message: 'Your account has been deactivated.' };
  }

  async getMyEligibleRequests(userId: string): Promise<EligibleOpenRequest[]> {
    const donor = await this.prisma.donorProfile.findUnique({
      where: { userId },
      include: {
        user: { select: { isActive: true } },
        area: { select: { id: true, name: true } },
      },
    });
    if (!donor) throw new NotFoundException('Donor not found.');

    const now = this.clock.now();
    const [activePledge, requests] = await Promise.all([
      this.prisma.pledge.findFirst({
        where: { donorId: donor.id, status: PledgeStatus.PLEDGED },
        select: { id: true },
      }),
      this.prisma.bloodRequest.findMany({
        where: { status: RequestStatus.OPEN, areaId: donor.areaId },
        include: {
          area: { select: { id: true, name: true } },
          _count: {
            select: {
              pledges: { where: { status: PledgeStatus.PLEDGED } },
            },
          },
        },
      }),
    ]);

    const eligibleRequests = requests.filter(
      (request) =>
        this.matchingService.checkDonorEligibilityForRequest(
          donor,
          request,
          now,
        ).eligible,
    );

    eligibleRequests.sort((a, b) => {
      const urgencyOrder =
        URGENCY_SORT_ORDER[a.urgency] - URGENCY_SORT_ORDER[b.urgency];
      return urgencyOrder || a.createdAt.getTime() - b.createdAt.getTime();
    });

    return eligibleRequests.map((request) => {
      const unitsStillNeeded = Math.max(
        0,
        request.unitsRequired - request.unitsCollected,
      );
      const activePledgesCount = request._count.pledges;
      return {
        id: request.id,
        bloodType: toApiBloodType(request.bloodType),
        area: { id: request.area.id, name: request.area.name },
        urgency: request.urgency,
        hospital: request.hospital,
        unitsRequired: request.unitsRequired,
        unitsCollected: request.unitsCollected,
        unitsStillNeeded,
        activePledgesCount,
        canPledge: !activePledge && activePledgesCount < unitsStillNeeded,
        createdAt: request.createdAt.toISOString(),
      };
    });
  }

  async findAllDonors(): Promise<CoordinatorDonorItem[]> {
    const donors = await this.prisma.donorProfile.findMany({
      include: {
        user: {
          select: { phone: true, email: true, isActive: true },
        },
        area: { select: { id: true, name: true } },
      },
      orderBy: { fullName: 'asc' },
    });
    const now = this.clock.now();

    return donors.map((donor) => ({
      id: donor.id,
      fullName: donor.fullName,
      phone: donor.user.phone,
      email: donor.user.email,
      bloodType: toApiBloodType(donor.bloodType),
      area: { id: donor.area.id, name: donor.area.name },
      isAvailable: donor.isAvailable,
      isActive: donor.user.isActive,
      lastDonationDate: donor.lastDonationDate
        ? toDateOnlyString(donor.lastDonationDate)
        : null,
      nextAllowedDonationDate:
        this.matchingService.getNextAllowedDonationDate(donor.lastDonationDate),
      eligibilityStatus: this.matchingService.getDonorEligibilityStatus(
        donor,
        now,
      ),
    }));
  }

  private toDashboardProfile(donor: DashboardDonor): DonorDashboardProfile {
    const activePledge = donor.pledges[0];
    const pledgeResponse: DonorActivePledge | null = activePledge
      ? {
          id: activePledge.id,
          status: activePledge.status,
          createdAt: activePledge.createdAt.toISOString(),
          request: {
            id: activePledge.request.id,
            bloodType: toApiBloodType(activePledge.request.bloodType),
            area: {
              id: activePledge.request.area.id,
              name: activePledge.request.area.name,
            },
            urgency: activePledge.request.urgency,
            hospital: activePledge.request.hospital,
            unitsRequired: activePledge.request.unitsRequired,
            unitsCollected: activePledge.request.unitsCollected,
            unitsStillNeeded: Math.max(
              0,
              activePledge.request.unitsRequired -
                activePledge.request.unitsCollected,
            ),
            status: activePledge.request.status,
          },
        }
      : null;

    const donationHistory: DonorDonationHistoryItem[] = donor.donations.map(
      (donation) => ({
        id: donation.id,
        donationDate: toDateOnlyString(donation.donationDate),
        units: donation.units,
        request: {
          id: donation.request.id,
          bloodType: toApiBloodType(donation.request.bloodType),
          hospital: donation.request.hospital,
          area: {
            id: donation.request.area.id,
            name: donation.request.area.name,
          },
        },
      }),
    );

    return {
      id: donor.id,
      userId: donor.userId,
      fullName: donor.fullName,
      phone: donor.user.phone,
      email: donor.user.email,
      bloodType: toApiBloodType(donor.bloodType),
      area: { id: donor.area.id, name: donor.area.name },
      isAvailable: donor.isAvailable,
      isActive: donor.user.isActive,
      lastDonationDate: donor.lastDonationDate
        ? toDateOnlyString(donor.lastDonationDate)
        : null,
      nextAllowedDonationDate:
        this.matchingService.getNextAllowedDonationDate(donor.lastDonationDate),
      eligibilityStatus: this.matchingService.getDonorEligibilityStatus(
        donor,
        this.clock.now(),
      ),
      activePledge: pledgeResponse,
      donationHistory,
    };
  }
}
