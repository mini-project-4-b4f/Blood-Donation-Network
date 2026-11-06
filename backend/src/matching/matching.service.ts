import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PledgeStatus, RequestStatus } from '@prisma/client';
import { ClockService } from '../common/clock.service';
import {
  ApiBloodType,
  BLOOD_COMPATIBILITY_MAP,
  REST_PERIOD_DAYS,
} from '../common/constants';
import {
  toApiBloodType,
  toDateOnlyString,
  toPrismaBloodType,
} from '../common/normalize.util';
import { PrismaService } from '../prisma/prisma.service';
import {
  DonorForEligibility,
  EligibilityCheckResult,
  EligibilityCode,
  EligibilityStatus,
  EligibleDonorItem,
  EligibleDonorsResponse,
  ExcludedSummary,
  RequestForEligibility,
} from './matching.types';

/**
 * Central matching & eligibility engine (R-1..R-8).
 * RequestsService, DonationsService, DonorsService and PledgesService must call this service
 * instead of re-implementing compatibility, rest-period or ranking rules.
 */
@Injectable()
export class MatchingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clock: ClockService,
  ) {}

  // ---------------------------------------------------------------- R-1, R-2

  /** True when a donor of `donorType` can give red cells to a patient needing `neededType`. */
  isBloodCompatible(neededType: ApiBloodType, donorType: ApiBloodType): boolean {
    return BLOOD_COMPATIBILITY_MAP[neededType].includes(donorType);
  }

  /** Compatible donor blood types for `neededType` (exact match listed first). */
  getCompatibleDonorTypes(neededType: ApiBloodType): ApiBloodType[] {
    return [...BLOOD_COMPATIBILITY_MAP[neededType]];
  }

  // ---------------------------------------------------------- R-3, R-4, R-5

  /**
   * `lastDonationDate + REST_PERIOD_DAYS` as `YYYY-MM-DD`; `null` when the donor never donated (R-5).
   * Calendar arithmetic uses local date parts, so daylight-saving changes never shift the day.
   */
  getNextAllowedDonationDate(lastDonationDate: Date | null): string | null {
    if (lastDonationDate === null) return null;
    const next = new Date(
      lastDonationDate.getFullYear(),
      lastDonationDate.getMonth(),
      lastDonationDate.getDate() + REST_PERIOD_DAYS,
    );
    return toDateOnlyString(next);
  }

  /**
   * True while today is strictly before `nextAllowedDonationDate` (R-4).
   * On `nextAllowedDonationDate` itself the donor can donate again.
   */
  isInRestPeriod(lastDonationDate: Date | null, now: Date): boolean {
    const nextAllowed = this.getNextAllowedDonationDate(lastDonationDate);
    if (nextAllowed === null) return false;
    return toDateOnlyString(now) < nextAllowed;
  }

  // ------------------------------------------------------------------- FR-4

  /** INACTIVE, then REST_PERIOD, then UNAVAILABLE, otherwise ELIGIBLE. */
  getDonorEligibilityStatus(
    donor: Pick<DonorForEligibility, 'isAvailable' | 'lastDonationDate' | 'user'>,
    now: Date,
  ): EligibilityStatus {
    if (!donor.user.isActive) return 'INACTIVE';
    if (this.isInRestPeriod(donor.lastDonationDate, now)) return 'REST_PERIOD';
    if (!donor.isAvailable) return 'UNAVAILABLE';
    return 'ELIGIBLE';
  }

  // ----------------------------------------------------- R-6, R-15, R-19

  /**
   * Checks the 5 conditions in this exact order and stops at the first failure:
   * (1) account active, (2) not in rest period, (3) available, (4) blood compatible, (5) same area.
   */
  checkDonorEligibilityForRequest(
    donor: DonorForEligibility,
    request: RequestForEligibility,
    now: Date,
  ): EligibilityCheckResult {
    if (!donor.user.isActive) {
      return this.ineligible(
        'INACTIVE',
        'This donor account is deactivated and cannot donate.',
        'This account has been deactivated.',
      );
    }

    const nextAllowed = this.getNextAllowedDonationDate(donor.lastDonationDate);
    if (nextAllowed !== null && this.isInRestPeriod(donor.lastDonationDate, now)) {
      return this.ineligible(
        'REST_PERIOD',
        `This donor is in rest period until ${nextAllowed}.`,
        `You cannot pledge while in rest period. Your next allowed donation date is ${nextAllowed}.`,
      );
    }

    if (!donor.isAvailable) {
      return this.ineligible(
        'UNAVAILABLE',
        'This donor is currently marked as unavailable.',
        'You cannot pledge while your availability is set to unavailable.',
      );
    }

    const donorType = toApiBloodType(donor.bloodType);
    const neededType = toApiBloodType(request.bloodType);
    if (!this.isBloodCompatible(neededType, donorType)) {
      return this.ineligible(
        'INCOMPATIBLE_BLOOD',
        `This donor's blood type (${donorType}) is not compatible with ${neededType}.`,
        `Your blood type (${donorType}) is not compatible with this request (${neededType}).`,
      );
    }

    if (donor.areaId !== request.areaId) {
      return this.ineligible(
        'DIFFERENT_AREA',
        `This donor is in ${donor.area.name}, but the request is in ${request.area.name}.`,
        `You can only pledge to requests in your registered area (${donor.area.name}).`,
      );
    }

    return { eligible: true };
  }

  // ------------------------------------------------------------- R-7, R-8

  /**
   * Ranked eligible donors + excluded-donor summary for an OPEN request.
   * 404 if the request does not exist, 409 if it is not OPEN (R-9).
   */
  async getEligibleDonorsForRequest(requestId: string): Promise<EligibleDonorsResponse> {
    const request = await this.prisma.bloodRequest.findUnique({
      where: { id: requestId },
      include: { area: { select: { id: true, name: true } } },
    });
    if (!request) throw new NotFoundException('Blood request not found.');
    if (request.status !== RequestStatus.OPEN) {
      throw new ConflictException('Eligible donors can only be matched for OPEN requests.');
    }

    const now = this.clock.now();
    const neededType = toApiBloodType(request.bloodType);
    const compatibleTypes = this.getCompatibleDonorTypes(neededType).map(toPrismaBloodType);

    const donors = await this.prisma.donorProfile.findMany({
      where: { areaId: request.areaId, bloodType: { in: compatibleTypes } },
      include: {
        user: { select: { phone: true, isActive: true } },
        area: { select: { id: true, name: true } },
        pledges: {
          where: { requestId: request.id, status: PledgeStatus.PLEDGED },
          select: { id: true },
        },
      },
    });

    const excludedSummary: ExcludedSummary = { restPeriod: 0, unavailable: 0, inactive: 0 };
    const eligible: typeof donors = [];

    for (const donor of donors) {
      const status = this.getDonorEligibilityStatus(donor, now);
      if (status === 'INACTIVE') excludedSummary.inactive += 1;
      else if (status === 'REST_PERIOD') excludedSummary.restPeriod += 1;
      else if (status === 'UNAVAILABLE') excludedSummary.unavailable += 1;
      else eligible.push(donor);
    }

    eligible.sort((a, b) => {
      // 1) exact blood-type match first
      const exactA = a.bloodType === request.bloodType;
      const exactB = b.bloodType === request.bloodType;
      if (exactA !== exactB) return exactA ? -1 : 1;

      // 2) never donated first, then the oldest donation first
      const timeA = a.lastDonationDate ? a.lastDonationDate.getTime() : null;
      const timeB = b.lastDonationDate ? b.lastDonationDate.getTime() : null;
      if (timeA === null && timeB !== null) return -1;
      if (timeA !== null && timeB === null) return 1;
      if (timeA !== null && timeB !== null && timeA !== timeB) return timeA - timeB;

      // 3) alphabetical by full name
      return a.fullName.localeCompare(b.fullName);
    });

    const eligibleDonors: EligibleDonorItem[] = eligible.map((donor, index) => ({
      rank: index + 1,
      id: donor.id,
      fullName: donor.fullName,
      phone: donor.user.phone,
      bloodType: toApiBloodType(donor.bloodType),
      isExactBloodMatch: donor.bloodType === request.bloodType,
      area: { id: donor.area.id, name: donor.area.name },
      lastDonationDate: donor.lastDonationDate ? toDateOnlyString(donor.lastDonationDate) : null,
      hasActivePledgeForThisRequest: donor.pledges.length > 0,
    }));

    return {
      requestId: request.id,
      bloodTypeNeeded: neededType,
      area: { id: request.area.id, name: request.area.name },
      eligibleDonors,
      excludedSummary,
    };
  }

  private ineligible(
    code: EligibilityCode,
    forCoordinator: string,
    forDonor: string,
  ): EligibilityCheckResult {
    return { eligible: false, code, reason: forCoordinator, forCoordinator, forDonor };
  }
}
