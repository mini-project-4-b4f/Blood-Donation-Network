import type { BloodType } from './types/auth.types';

// These lists populate controls. The API still decides all matching rules.
export const BLOOD_TYPES = [
  'O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+',
] as const satisfies readonly BloodType[];

export const URGENCY_LEVELS = ['CRITICAL', 'HIGH', 'NORMAL'] as const;
export const REQUEST_STATUSES = ['OPEN', 'FULFILLED', 'CANCELLED'] as const;

export const MIN_UNITS = 1;
export const MAX_UNITS = 10;
