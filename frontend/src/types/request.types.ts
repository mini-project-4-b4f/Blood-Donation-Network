import type { Area, BloodType } from './auth.types';
import type { PledgeStatus } from './donor.types';

export type Urgency = 'CRITICAL' | 'HIGH' | 'NORMAL';

export type RequestStatus = 'OPEN' | 'FULFILLED' | 'CANCELLED';

export interface PublicSosRequest {
  id: string;
  bloodType: BloodType;
  area: Area;
  urgency: Urgency;
  hospital: string;
  unitsStillNeeded: number;
  createdAt: string;
}

export interface CoordinatorRequestSummary {
  id: string;
  patientReference: string;
  bloodType: BloodType;
  unitsRequired: number;
  unitsCollected: number;
  unitsStillNeeded: number;
  area: Area;
  urgency: Urgency;
  status: RequestStatus;
  hospital: string;
  note: string | null;
  cancelReason: string | null;
  activePledgesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface RequestPledgeItem {
  id: string;
  status: PledgeStatus;
  createdAt: string;
  donor: {
    id: string;
    fullName: string;
    phone: string;
    bloodType: BloodType;
    area: Area;
  };
}

export interface RequestDonationItem {
  id: string;
  donationDate: string;
  units: number;
  createdAt: string;
  donor: {
    id: string;
    fullName: string;
    phone: string;
    bloodType: BloodType;
  };
  recordedBy: {
    id: string;
    phone: string;
    email: string | null;
  };
}

export interface CoordinatorRequestDetails extends CoordinatorRequestSummary {
  pledges: RequestPledgeItem[];
  donations: RequestDonationItem[];
}

export interface RankedEligibleDonor {
  rank: number;
  id: string;
  fullName: string;
  phone: string;
  bloodType: BloodType;
  isExactBloodMatch: boolean;
  area: Area;
  lastDonationDate: string | null;
  hasActivePledgeForThisRequest: boolean;
}

export interface ExcludedDonorsSummary {
  restPeriod: number;
  unavailable: number;
  inactive: number;
}

export interface EligibleDonorsResponse {
  requestId: string;
  bloodTypeNeeded: BloodType;
  area: Area;
  eligibleDonors: RankedEligibleDonor[];
  excludedSummary: ExcludedDonorsSummary;
}

export interface RequestFilters {
  status?: RequestStatus;
  bloodType?: BloodType;
  areaId?: string;
  urgency?: Urgency;
}

export interface CreateRequestPayload {
  patientReference: string;
  bloodType: BloodType;
  unitsRequired: number;
  areaId: string;
  urgency: Urgency;
  hospital: string;
  note?: string;
}

export interface UpdateRequestPayload {
  unitsRequired?: number;
  urgency?: Urgency;
  note?: string;
}

export interface CancelRequestPayload {
  cancelReason: string;
}

export interface RecordDonationPayload {
  donorId: string;
  donationDate: string;
}
