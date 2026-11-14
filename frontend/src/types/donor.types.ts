import type { Area, BloodType } from './auth.types';
import type { Urgency, RequestStatus } from './request.types';

export type { Area } from './auth.types';

export type EligibilityStatus = 'ELIGIBLE' | 'REST_PERIOD' | 'UNAVAILABLE' | 'INACTIVE';

export type PledgeStatus = 'PLEDGED' | 'COMPLETED' | 'WITHDRAWN' | 'RELEASED';

export interface ActivePledge {
  id: string;
  status: PledgeStatus;
  createdAt: string;
  request: {
    id: string;
    bloodType: BloodType;
    area: Area;
    urgency: Urgency;
    hospital: string;
    unitsRequired: number;
    unitsCollected: number;
    unitsStillNeeded: number;
    status: RequestStatus;
  };
}

export interface DonationHistoryItem {
  id: string;
  donationDate: string;
  units: number;
  request: {
    id: string;
    bloodType: BloodType;
    hospital: string;
    area: Area;
  };
}

export interface DonorDashboardProfile {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  email: string | null;
  bloodType: BloodType;
  area: Area;
  isAvailable: boolean;
  isActive: boolean;
  lastDonationDate: string | null;
  nextAllowedDonationDate: string | null;
  eligibilityStatus: EligibilityStatus;
  activePledge: ActivePledge | null;
  donationHistory: DonationHistoryItem[];
}

export interface EligibleOpenRequest {
  id: string;
  bloodType: BloodType;
  area: Area;
  urgency: Urgency;
  hospital: string;
  unitsRequired: number;
  unitsCollected: number;
  unitsStillNeeded: number;
  activePledgesCount: number;
  canPledge: boolean;
  createdAt: string;
}

export interface UpdateDonorProfileDto {
  areaId?: string;
  phone?: string;
  isAvailable?: boolean;
}

export interface CoordinatorDonorItem {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  bloodType: BloodType;
  area: Area;
  isAvailable: boolean;
  isActive: boolean;
  lastDonationDate: string | null;
  nextAllowedDonationDate: string | null;
  eligibilityStatus: EligibilityStatus;
}
