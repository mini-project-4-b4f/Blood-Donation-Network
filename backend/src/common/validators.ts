import { registerDecorator, ValidationOptions } from 'class-validator';
import { API_BLOOD_TYPES, ApiBloodType } from './constants';
import { normalizePhone } from './normalize.util';

function createDecorator(
  name: string,
  defaultMessage: string,
  isValid: (value: unknown) => boolean,
) {
  return (validationOptions?: ValidationOptions): PropertyDecorator =>
    (object, propertyName) => {
      registerDecorator({
        name,
        target: object.constructor,
        propertyName: propertyName as string,
        options: { message: defaultMessage, ...validationOptions },
        validator: { validate: (value: unknown) => isValid(value) },
      });
    };
}

/** Passes when the value is one of 'O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'. */
export const IsValidBloodType = createDecorator(
  'isValidBloodType',
  'Invalid blood type. Must be one of O-, O+, A-, A+, B-, B+, AB-, AB+.',
  (value) => typeof value === 'string' && (API_BLOOD_TYPES as readonly string[]).includes(value as ApiBloodType),
);

/** After removing spaces and dashes: optional `+` followed by 8 to 15 digits. */
export const IsValidPhone = createDecorator(
  'isValidPhone',
  'A valid phone number is required.',
  (value) => typeof value === 'string' && /^\+?\d{8,15}$/.test(normalizePhone(value)),
);

/** `YYYY-MM-DD` that is a real calendar date ('2026-02-31' fails). */
export const IsCalendarDate = createDecorator(
  'isCalendarDate',
  'Invalid date. Use the format YYYY-MM-DD.',
  (value) => {
    if (typeof value !== 'string') return false;
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return false;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  },
);
