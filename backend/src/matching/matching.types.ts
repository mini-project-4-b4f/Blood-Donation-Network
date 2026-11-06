import { BloodType } from '@prisma/client';
import { ApiBloodType } from '../common/constants';

/** Result of getDonorEligibilityStatus (FR-4). Check order: INACTIVE, REST_PERIOD, UNAVAILABLE. */
export type EligibilityStatus = 'ELIGIBLE' | 'REST_PERIOD' | 'UNAVAILABLE' | 'INACTIVE';

/** Why a donor is not eligible for a request (R-6). */
export type EligibilityCode =
  | 'INACTIVE'
  | 'REST_PERIOD'
  | 'UNAVAILABLE'
  | 'INCOMPATIBLE_BLOOD'
  | 'DIFFERENT_AREA';

/**
 * A donor as loaded from Prisma with `include: { user: true, area: true }`
 * (only the fields the matching rules need). `bloodType` is the Prisma enum (`A_NEG`).
 */
export interface DonorForEligibility {
  bloodType: BloodType;
  areaId: string;
  isAvailable: boolean;
  lastDonationDate: Date | null;
  user: { isActive: boolean };
  area: { name: string };
}

/** A request as loaded from Prisma with `include: { area: true }`. */
export interface RequestForEligibility {
  bloodType: BloodType;
  areaId: string;
  area: { name: string };
}

/**
 * Result of checkDonorEligibilityForRequest.
 * - `forCoordinator` is used by POST /donations (DonationsService).
 * - `forDonor` is used by POST /pledges (PledgesService).
 * - `reason` carries the same text as `forCoordinator` (compatibility with the older docs wording).
 */
export type EligibilityCheckResult =
  | { eligible: true }
  | {
      eligible: false;
      code: EligibilityCode;
      reason: string;
      forCoordinator: string;
      forDonor: string;
    };

/** docs/API.md section 4.6 */
export interface EligibleDonorItem {
  rank: number;
  id: string;
  fullName: string;
  phone: string;
  bloodType: ApiBloodType;
  isExactBloodMatch: boolean;
  area: { id: string; name: string };
  lastDonationDate: string | null;
  hasActivePledgeForThisRequest: boolean;
}

export interface ExcludedSummary {
  restPeriod: number;
  unavailable: number;
  inactive: number;
}

export interface EligibleDonorsResponse {
  requestId: string;
  bloodTypeNeeded: ApiBloodType;
  area: { id: string; name: string };
  eligibleDonors: EligibleDonorItem[];
  excludedSummary: ExcludedSummary;
}
