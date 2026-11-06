export type BloodType = 'O-' | 'O+' | 'A-' | 'A+' | 'B-' | 'B+' | 'AB-' | 'AB+';

export type EligibilityStatus = 'ELIGIBLE' | 'REST_PERIOD' | 'UNAVAILABLE' | 'INACTIVE';

export type RequestUrgency = 'CRITICAL' | 'HIGH' | 'NORMAL';

export type RequestStatus = 'OPEN' | 'FULFILLED' | 'CANCELLED';

export type PledgeStatus = 'PLEDGED' | 'COMPLETED' | 'WITHDRAWN' | 'RELEASED';

export interface Area {
  id: string;
  name: string;
}

export interface DonorRequestSummary {
  id: string;
  bloodType: BloodType;
  area: Area;
  urgency: RequestUrgency;
  hospital: string;
  unitsRequired: number;
  unitsCollected: number;
  unitsStillNeeded: number;
  status: RequestStatus;
}

export interface ActivePledge {
  id: string;
  status: PledgeStatus;
  createdAt: string;
  request: DonorRequestSummary;
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
  email?: string;
  bloodType: BloodType;
  area: Area;
  isAvailable: boolean;
  isActive: boolean;
  lastDonationDate?: string | null;
  nextAllowedDonationDate?: string | null;
  eligibilityStatus: EligibilityStatus;
  activePledge?: ActivePledge | null;
  donationHistory: DonationHistoryItem[];
}

export interface EligibleOpenRequest {
  id: string;
  bloodType: BloodType;
  area: Area;
  urgency: RequestUrgency;
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