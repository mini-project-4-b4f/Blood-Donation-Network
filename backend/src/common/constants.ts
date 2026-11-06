/**
 * Single source of truth for business constants (R-1, R-2, R-3).
 * The rest period (56 days) must never be hardcoded anywhere else.
 */
export const REST_PERIOD_DAYS = 56;
export const MIN_UNITS = 1;
export const MAX_UNITS = 10;

export const API_BLOOD_TYPES = [
  'O-',
  'O+',
  'A-',
  'A+',
  'B-',
  'B+',
  'AB-',
  'AB+',
] as const;

export type ApiBloodType = (typeof API_BLOOD_TYPES)[number];

/**
 * R-1: Standard red-cell compatibility table.
 * Key = Blood type needed by the request.
 * Value = Compatible donor blood types (exact match listed first).
 */
export const BLOOD_COMPATIBILITY_MAP: Record<ApiBloodType, readonly ApiBloodType[]> = {
  'O-': ['O-'],
  'O+': ['O+', 'O-'],
  'A-': ['A-', 'O-'],
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'AB-': ['AB-', 'A-', 'B-', 'O-'],
  'AB+': ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-'],
};

export const URGENCY_SORT_ORDER: Record<'CRITICAL' | 'HIGH' | 'NORMAL', number> = {
  CRITICAL: 1,
  HIGH: 2,
  NORMAL: 3,
};
