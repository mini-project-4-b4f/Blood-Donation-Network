import { PledgeStatus, RequestStatus } from '@prisma/client';
import { ApiBloodType } from '../common/constants';
import { EligibilityStatus } from '../matching/matching.types';

export interface DonorArea {
  id: string;
  name: string;
}

export interface DonorActivePledge {
  id: string;
  status: PledgeStatus;
  createdAt: string;
  request: {
    id: string;
    bloodType: ApiBloodType;
    area: DonorArea;
    urgency: 'CRITICAL' | 'HIGH' | 'NORMAL';
    hospital: string;
    unitsRequired: number;
    unitsCollected: number;
    unitsStillNeeded: number;
    status: RequestStatus;
  };
}

export interface DonorDonationHistoryItem {
  id: string;
  donationDate: string;
  units: number;
  request: {
    id: string;
    bloodType: ApiBloodType;
    hospital: string;
    area: DonorArea;
  };
}

export interface DonorDashboardProfile {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  email: string | null;
  bloodType: ApiBloodType;
  area: DonorArea;
  isAvailable: boolean;
  isActive: boolean;
  lastDonationDate: string | null;
  nextAllowedDonationDate: string | null;
  eligibilityStatus: EligibilityStatus;
  activePledge: DonorActivePledge | null;
  donationHistory: DonorDonationHistoryItem[];
}

export interface EligibleOpenRequest {
  id: string;
  bloodType: ApiBloodType;
  area: DonorArea;
  urgency: 'CRITICAL' | 'HIGH' | 'NORMAL';
  hospital: string;
  unitsRequired: number;
  unitsCollected: number;
  unitsStillNeeded: number;
  activePledgesCount: number;
  canPledge: boolean;
  createdAt: string;
}

export interface CoordinatorDonorItem {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  bloodType: ApiBloodType;
  area: DonorArea;
  isAvailable: boolean;
  isActive: boolean;
  lastDonationDate: string | null;
  nextAllowedDonationDate: string | null;
  eligibilityStatus: EligibilityStatus;
}
