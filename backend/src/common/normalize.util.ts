import { BloodType } from '@prisma/client';
import { ApiBloodType } from './constants';

const PRISMA_TO_API: Record<BloodType, ApiBloodType> = {
  O_NEG: 'O-',
  O_POS: 'O+',
  A_NEG: 'A-',
  A_POS: 'A+',
  B_NEG: 'B-',
  B_POS: 'B+',
  AB_NEG: 'AB-',
  AB_POS: 'AB+',
};

const API_TO_PRISMA: Record<ApiBloodType, BloodType> = {
  'O-': 'O_NEG',
  'O+': 'O_POS',
  'A-': 'A_NEG',
  'A+': 'A_POS',
  'B-': 'B_NEG',
  'B+': 'B_POS',
  'AB-': 'AB_NEG',
  'AB+': 'AB_POS',
};

/** Removes spaces and dashes: "0933 112-233" -> "0933112233". */
export function normalizePhone(value: string): string {
  return value.replace(/[\s-]/g, '');
}

/** Trims and lowercases an email address. */
export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

/** Trims the patient reference (comparisons against the DB are case-insensitive). */
export function normalizePatientRef(value: string): string {
  return value.trim();
}

/** Prisma enum key (`A_NEG`) -> API notation (`'A-'`). */
export function toApiBloodType(value: BloodType): ApiBloodType {
  return PRISMA_TO_API[value];
}

/** API notation (`'A-'`) -> Prisma enum key (`A_NEG`). */
export function toPrismaBloodType(value: ApiBloodType): BloodType {
  return API_TO_PRISMA[value];
}

/**
 * Formats a Date as `YYYY-MM-DD` using LOCAL time (no UTC day shifting via toISOString()).
 */
export function toDateOnlyString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
