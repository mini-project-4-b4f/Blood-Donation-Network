import {
  BloodRequest,
  BloodType,
  RequestStatus,
  Urgency,
} from '@prisma/client';

export interface RequestFilters {
  status?: RequestStatus;
  bloodType?: BloodType;
  areaId?: string;
  urgency?: Urgency;
}

export type RequestWithArea = BloodRequest & {
  area: {
    id: string;
    name: string;
  };
};

export type PublicSosRequest = Pick<
  BloodRequest,
  'id' | 'bloodType' | 'urgency' | 'hospital' | 'createdAt'
> & {
  area: {
    id: string;
    name: string;
  };
  unitsStillNeeded: number;
};
