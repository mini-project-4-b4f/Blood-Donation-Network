import { ArgumentMetadata, BadRequestException, Type } from '@nestjs/common';
import { SignUpDto } from '../auth/dto/sign-up.dto';
import { RecordDonationDto } from '../donations/dto/record-donation.dto';
import { UpdateDonorProfileDto } from '../donors/dto/update-donor-profile.dto';
import { CancelRequestDto } from '../requests/dto/cancel-request.dto';
import { CreateRequestDto } from '../requests/dto/create-request.dto';
import { RequestFiltersQueryDto } from '../requests/dto/request-filters-query.dto';
import { UpdateRequestDto } from '../requests/dto/update-request.dto';
import { createValidationPipe } from './validation.pipe';

const pipe = createValidationPipe();
const VALID = 'VALID';

/** Runs the real global pipe and returns the single error message, or 'VALID'. */
async function messageFor(metatype: Type<unknown>, value: unknown, type: 'body' | 'query' = 'body'): Promise<string> {
  try {
    await pipe.transform(value, { type, metatype } as ArgumentMetadata);
    return VALID;
  } catch (error) {
    expect(error).toBeInstanceOf(BadRequestException);
    return (error as BadRequestException).message;
  }
}

const UNITS = 'Units required must be a whole number between 1 and 10.';
const URGENCY = 'Urgency must be CRITICAL, HIGH, or NORMAL.';

describe('global validation pipe (one readable message per request)', () => {
  describe('CreateRequestDto', () => {
    const valid = {
      patientReference: 'HOMS-ICU-402',
      bloodType: 'A-',
      unitsRequired: 3,
      areaId: 'area-homs',
      urgency: 'CRITICAL',
      hospital: 'Central Blood Bank Homs',
      note: 'Emergency surgery in Ward 3.',
    };

    it('accepts a valid body (note is optional)', async () => {
      expect(await messageFor(CreateRequestDto, valid)).toBe(VALID);
      expect(await messageFor(CreateRequestDto, { ...valid, note: undefined })).toBe(VALID);
    });

    it('reports the FIRST failing property in declaration order', async () => {
      expect(await messageFor(CreateRequestDto, {})).toBe('Patient reference is required.');
      expect(await messageFor(CreateRequestDto, { patientReference: 'X' })).toBe(
        'Invalid blood type. Must be one of O-, O+, A-, A+, B-, B+, AB-, AB+.',
      );
      expect(await messageFor(CreateRequestDto, { patientReference: 'X', bloodType: 'A-' })).toBe(UNITS);
    });

    it.each([
      ['a whitespace-only patientReference', { patientReference: '   ' }, 'Patient reference is required.'],
      ['an unknown blood type', { bloodType: 'C+' }, 'Invalid blood type. Must be one of O-, O+, A-, A+, B-, B+, AB-, AB+.'],
      ['units = 0', { unitsRequired: 0 }, UNITS],
      ['units = 11', { unitsRequired: 11 }, UNITS],
      ['units = 2.5', { unitsRequired: 2.5 }, UNITS],
      ['units sent as the string "3"', { unitsRequired: '3' }, UNITS],
      ['a missing areaId', { areaId: undefined }, 'Area is required.'],
      ['an invalid urgency', { urgency: 'URGENT' }, URGENCY],
      ['a missing hospital', { hospital: '' }, 'Hospital or blood-bank name is required.'],
      ['a non-text note', { note: 5 }, 'Note must be text.'],
    ])('rejects %s', async (_label, override, message) => {
      expect(await messageFor(CreateRequestDto, { ...valid, ...override })).toBe(message);
    });

    it("rejects unknown fields: \"Unknown field 'colour' is not allowed.\"", async () => {
      expect(await messageFor(CreateRequestDto, { ...valid, colour: 'red' })).toBe(
        "Unknown field 'colour' is not allowed.",
      );
    });
  });

  describe('UpdateRequestDto', () => {
    it('accepts {} and a partial body; note may be cleared with null', async () => {
      expect(await messageFor(UpdateRequestDto, {})).toBe(VALID);
      expect(await messageFor(UpdateRequestDto, { urgency: 'HIGH' })).toBe(VALID);
      expect(await messageFor(UpdateRequestDto, { note: null })).toBe(VALID);
    });

    it('rejects an explicit null for unitsRequired and urgency (never reaches the database)', async () => {
      expect(await messageFor(UpdateRequestDto, { unitsRequired: null })).toBe(UNITS);
      expect(await messageFor(UpdateRequestDto, { urgency: null })).toBe(URGENCY);
    });

    it('rejects out-of-range units', async () => {
      expect(await messageFor(UpdateRequestDto, { unitsRequired: 0 })).toBe(UNITS);
      expect(await messageFor(UpdateRequestDto, { unitsRequired: 11 })).toBe(UNITS);
    });
  });

  describe('CancelRequestDto', () => {
    it('requires a non-blank reason', async () => {
      expect(await messageFor(CancelRequestDto, {})).toBe('Cancellation reason is required.');
      expect(await messageFor(CancelRequestDto, { cancelReason: '   ' })).toBe('Cancellation reason is required.');
      expect(await messageFor(CancelRequestDto, { cancelReason: 'Patient transferred.' })).toBe(VALID);
    });
  });

  describe('RequestFiltersQueryDto (query string)', () => {
    it('accepts no filters and valid filters', async () => {
      expect(await messageFor(RequestFiltersQueryDto, {}, 'query')).toBe(VALID);
      expect(
        await messageFor(RequestFiltersQueryDto, { status: 'OPEN', bloodType: 'A-', areaId: 'area-homs', urgency: 'HIGH' }, 'query'),
      ).toBe(VALID);
    });

    it('rejects bad filters and unknown parameters', async () => {
      expect(await messageFor(RequestFiltersQueryDto, { status: 'DONE' }, 'query')).toBe(
        'Invalid status filter. Must be OPEN, FULFILLED, or CANCELLED.',
      );
      expect(await messageFor(RequestFiltersQueryDto, { bloodType: 'Z+' }, 'query')).toBe(
        'Invalid blood type. Must be one of O-, O+, A-, A+, B-, B+, AB-, AB+.',
      );
      expect(await messageFor(RequestFiltersQueryDto, { urgency: 'URGENT' }, 'query')).toBe(URGENCY);
      expect(await messageFor(RequestFiltersQueryDto, { colour: 'red' }, 'query')).toBe(
        "Unknown field 'colour' is not allowed.",
      );
    });
  });

  describe('RecordDonationDto', () => {
    it('accepts a real calendar date', async () => {
      expect(await messageFor(RecordDonationDto, { donorId: 'dp-sara', donationDate: '2026-11-01' })).toBe(VALID);
    });

    it.each([
      ['a missing donorId', { donationDate: '2026-11-01' }, 'Donor ID is required.'],
      ['a missing date', { donorId: 'dp-sara' }, 'Invalid date. Use the format YYYY-MM-DD.'],
      ['the wrong format', { donorId: 'dp-sara', donationDate: '01-11-2026' }, 'Invalid date. Use the format YYYY-MM-DD.'],
      ['an impossible date (2026-02-31)', { donorId: 'dp-sara', donationDate: '2026-02-31' }, 'Invalid date. Use the format YYYY-MM-DD.'],
    ])('rejects %s', async (_label, body, message) => {
      expect(await messageFor(RecordDonationDto, body)).toBe(message);
    });
  });

  describe('UpdateDonorProfileDto', () => {
    it('accepts {} and valid partial updates', async () => {
      expect(await messageFor(UpdateDonorProfileDto, {})).toBe(VALID);
      expect(await messageFor(UpdateDonorProfileDto, { isAvailable: false })).toBe(VALID);
      expect(await messageFor(UpdateDonorProfileDto, { areaId: 'area-homs', phone: '0933112233', isAvailable: true })).toBe(VALID);
    });

    it('normalizes the phone (spaces and dashes removed)', async () => {
      const result = (await pipe.transform({ phone: '0933 112-233' }, {
        type: 'body',
        metatype: UpdateDonorProfileDto,
      } as ArgumentMetadata)) as UpdateDonorProfileDto;
      expect(result.phone).toBe('0933112233');
    });

    it.each([
      ['an invalid phone', { phone: 'abc' }, 'A valid phone number is required.'],
      ['a null phone', { phone: null }, 'A valid phone number is required.'],
      ['a string availability', { isAvailable: 'true' }, 'Availability must be a boolean value.'],
      ['a null availability', { isAvailable: null }, 'Availability must be a boolean value.'],
      ['a non-text areaId', { areaId: 5 }, 'Selected area is not supported.'],
    ])('rejects %s', async (_label, body, message) => {
      expect(await messageFor(UpdateDonorProfileDto, body)).toBe(message);
    });
  });

  describe('SignUpDto', () => {
    const valid = {
      fullName: 'Sara Al-Khatib',
      phone: '0933112233',
      password: 'DonorPassword123',
      bloodType: 'A-',
      areaId: 'area-homs',
    };

    it('accepts a valid body with or without an email', async () => {
      expect(await messageFor(SignUpDto, valid)).toBe(VALID);
      expect(await messageFor(SignUpDto, { ...valid, email: 'sara@example.com' })).toBe(VALID);
    });

    it.each([
      ['a missing fullName', { fullName: undefined }, 'Full name is required.'],
      ['a bad phone', { phone: '12' }, 'A valid phone number is required.'],
      ['a bad email', { email: 'not-an-email' }, 'Please provide a valid email address.'],
      ['a short password', { password: 'short' }, 'Password must be at least 8 characters long.'],
      ['an unknown blood type', { bloodType: 'C+' }, 'Invalid blood type. Must be one of O-, O+, A-, A+, B-, B+, AB-, AB+.'],
      ['a missing area', { areaId: '' }, 'Area is required.'],
      ['a forbidden role field', { role: 'COORDINATOR' }, "Unknown field 'role' is not allowed."],
    ])('rejects %s', async (_label, override, message) => {
      expect(await messageFor(SignUpDto, { ...valid, ...override })).toBe(message);
    });
  });
});
