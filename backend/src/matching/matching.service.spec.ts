import { ConflictException, NotFoundException } from '@nestjs/common';
import { BloodType } from '@prisma/client';
import { ClockService } from '../common/clock.service';
import {
  API_BLOOD_TYPES,
  BLOOD_COMPATIBILITY_MAP,
  REST_PERIOD_DAYS,
} from '../common/constants';
import { toDateOnlyString } from '../common/normalize.util';
import { PrismaService } from '../prisma/prisma.service';
import { MatchingService } from './matching.service';
import { DonorForEligibility, RequestForEligibility } from './matching.types';

// "Today" for every test: 2026-11-05 (local time).
const NOW = new Date(2026, 10, 5, 12, 0, 0);
const daysAgo = (n: number): Date => new Date(2026, 10, 5 - n);

const HOMS = { id: 'area-homs', name: 'Homs' };
const DAMASCUS = { id: 'area-damascus', name: 'Damascus' };

interface DonorRow extends DonorForEligibility {
  id: string;
  fullName: string;
  user: { phone: string; isActive: boolean };
  area: { id: string; name: string };
  pledges: { id: string }[];
}

interface DonorOptions {
  fullName: string;
  bloodType: BloodType;
  lastDonationDate?: Date | null;
  isAvailable?: boolean;
  isActive?: boolean;
  area?: { id: string; name: string };
  pledges?: { id: string }[];
}

function makeDonor(o: DonorOptions): DonorRow {
  const area = o.area ?? HOMS;
  return {
    id: `dp-${o.fullName.toLowerCase()}`,
    fullName: o.fullName,
    bloodType: o.bloodType,
    areaId: area.id,
    area,
    isAvailable: o.isAvailable ?? true,
    lastDonationDate: o.lastDonationDate ?? null,
    user: { phone: '0933000000', isActive: o.isActive ?? true },
    pledges: o.pledges ?? [],
  };
}

interface RequestRow {
  id: string;
  bloodType: BloodType;
  areaId: string;
  status: 'OPEN' | 'FULFILLED' | 'CANCELLED';
  area: { id: string; name: string };
}

function makeRequest(bloodType: BloodType, status: RequestRow['status'] = 'OPEN'): RequestRow {
  return { id: 'req-101', bloodType, areaId: HOMS.id, status, area: HOMS };
}

/** MatchingService wired to an in-memory Prisma double that applies the same `where` filter. */
function buildService(request: RequestRow | null, donors: DonorRow[] = []) {
  const findMany = jest.fn(
    async (args: { where: { areaId: string; bloodType: { in: BloodType[] } } }) =>
      donors.filter(
        (d) => d.areaId === args.where.areaId && args.where.bloodType.in.includes(d.bloodType),
      ),
  );
  const prisma = {
    bloodRequest: { findUnique: jest.fn(async () => request) },
    donorProfile: { findMany },
  } as unknown as PrismaService;
  const clock = { now: () => NOW } as unknown as ClockService;
  return { service: new MatchingService(prisma, clock), findMany };
}

describe('MatchingService', () => {
  const { service } = buildService(null);

  // ---------------------------------------------------------------- R-1, R-2
  describe('blood compatibility (R-1, R-2)', () => {
    const table: Array<[string, string[]]> = [
      ['O-', ['O-']],
      ['O+', ['O+', 'O-']],
      ['A-', ['A-', 'O-']],
      ['A+', ['A+', 'A-', 'O+', 'O-']],
      ['B-', ['B-', 'O-']],
      ['B+', ['B+', 'B-', 'O+', 'O-']],
      ['AB-', ['AB-', 'A-', 'B-', 'O-']],
      ['AB+', ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-']],
    ];

    it.each(table)('getCompatibleDonorTypes(%s) matches the official table', (needed, expected) => {
      expect(service.getCompatibleDonorTypes(needed as never)).toEqual(expected);
    });

    it('isBloodCompatible is true exactly for the compatible pairs (all 64 combinations)', () => {
      for (const needed of API_BLOOD_TYPES) {
        for (const donor of API_BLOOD_TYPES) {
          expect(service.isBloodCompatible(needed, donor)).toBe(
            BLOOD_COMPATIBILITY_MAP[needed].includes(donor),
          );
        }
      }
    });

    it('rejects the known incompatible pairs', () => {
      expect(service.isBloodCompatible('A-', 'A+')).toBe(false);
      expect(service.isBloodCompatible('O-', 'O+')).toBe(false);
      expect(service.isBloodCompatible('O-', 'A-')).toBe(false);
      expect(service.isBloodCompatible('B+', 'A+')).toBe(false);
    });

    it('returns a copy, so callers cannot mutate the shared table', () => {
      service.getCompatibleDonorTypes('A-').push('AB+');
      expect(BLOOD_COMPATIBILITY_MAP['A-']).toEqual(['A-', 'O-']);
    });
  });

  // ------------------------------------------------------------ R-3, R-4, R-5
  describe('rest period (R-3, R-4, R-5)', () => {
    it('uses a 56-day rest period', () => {
      expect(REST_PERIOD_DAYS).toBe(56);
    });

    it('donor who donated on 2026-11-01 can donate again on 2026-12-27', () => {
      const last = new Date(2026, 10, 1);
      expect(service.getNextAllowedDonationDate(last)).toBe('2026-12-27');
      expect(service.isInRestPeriod(last, new Date(2026, 11, 26, 23, 59))).toBe(true);
      expect(service.isInRestPeriod(last, new Date(2026, 11, 27, 0, 0))).toBe(false);
      expect(service.isInRestPeriod(last, new Date(2026, 11, 28))).toBe(false);
    });

    it('a donor who never donated has no rest period (R-5)', () => {
      expect(service.getNextAllowedDonationDate(null)).toBeNull();
      expect(service.isInRestPeriod(null, NOW)).toBe(false);
    });

    it('is in rest on the donation day itself', () => {
      expect(service.isInRestPeriod(new Date(2026, 10, 5), NOW)).toBe(true);
    });

    it('crosses a year boundary correctly', () => {
      expect(service.getNextAllowedDonationDate(new Date(2026, 11, 20))).toBe('2027-02-14');
    });
  });

  // -------------------------------------------------------------------- FR-4
  describe('getDonorEligibilityStatus', () => {
    const base = { isAvailable: true, lastDonationDate: null as Date | null, user: { isActive: true } };

    it('ELIGIBLE for an active, available donor outside the rest period', () => {
      expect(service.getDonorEligibilityStatus(base, NOW)).toBe('ELIGIBLE');
      expect(service.getDonorEligibilityStatus({ ...base, lastDonationDate: daysAgo(56) }, NOW)).toBe('ELIGIBLE');
    });

    it('REST_PERIOD when donated less than 56 days ago', () => {
      expect(service.getDonorEligibilityStatus({ ...base, lastDonationDate: daysAgo(20) }, NOW)).toBe('REST_PERIOD');
      expect(service.getDonorEligibilityStatus({ ...base, lastDonationDate: daysAgo(55) }, NOW)).toBe('REST_PERIOD');
    });

    it('UNAVAILABLE when isAvailable is false', () => {
      expect(service.getDonorEligibilityStatus({ ...base, isAvailable: false }, NOW)).toBe('UNAVAILABLE');
    });

    it('INACTIVE wins over everything else', () => {
      const worst = { isAvailable: false, lastDonationDate: daysAgo(5), user: { isActive: false } };
      expect(service.getDonorEligibilityStatus(worst, NOW)).toBe('INACTIVE');
    });

    it('REST_PERIOD wins over UNAVAILABLE', () => {
      const both = { isAvailable: false, lastDonationDate: daysAgo(5), user: { isActive: true } };
      expect(service.getDonorEligibilityStatus(both, NOW)).toBe('REST_PERIOD');
    });
  });

  // ------------------------------------------------------------ R-6, R-15, R-19
  describe('checkDonorEligibilityForRequest', () => {
    const request: RequestForEligibility = { bloodType: 'A_NEG', areaId: HOMS.id, area: HOMS };
    const eligibleDonor = makeDonor({ fullName: 'Sara', bloodType: 'A_NEG' });

    it('eligible donor passes all five checks', () => {
      expect(service.checkDonorEligibilityForRequest(eligibleDonor, request, NOW)).toEqual({ eligible: true });
    });

    it('1. inactive account', () => {
      const result = service.checkDonorEligibilityForRequest(
        makeDonor({ fullName: 'Karim', bloodType: 'A_NEG', isActive: false }),
        request,
        NOW,
      );
      expect(result).toEqual({
        eligible: false,
        code: 'INACTIVE',
        reason: 'This donor account is deactivated and cannot donate.',
        forCoordinator: 'This donor account is deactivated and cannot donate.',
        forDonor: 'This account has been deactivated.',
      });
    });

    it('2. rest period (includes the next allowed date)', () => {
      const donor = makeDonor({ fullName: 'Rami', bloodType: 'O_NEG', lastDonationDate: new Date(2026, 10, 1) });
      const result = service.checkDonorEligibilityForRequest(donor, request, NOW);
      expect(result).toMatchObject({
        eligible: false,
        code: 'REST_PERIOD',
        forCoordinator: 'This donor is in rest period until 2026-12-27.',
        forDonor: 'You cannot pledge while in rest period. Your next allowed donation date is 2026-12-27.',
      });
    });

    it('3. unavailable donor', () => {
      const donor = makeDonor({ fullName: 'Huda', bloodType: 'A_NEG', isAvailable: false });
      expect(service.checkDonorEligibilityForRequest(donor, request, NOW)).toMatchObject({
        eligible: false,
        code: 'UNAVAILABLE',
        forCoordinator: 'This donor is currently marked as unavailable.',
        forDonor: 'You cannot pledge while your availability is set to unavailable.',
      });
    });

    it('4. incompatible blood type', () => {
      const donor = makeDonor({ fullName: 'Lina', bloodType: 'A_POS' });
      expect(service.checkDonorEligibilityForRequest(donor, request, NOW)).toMatchObject({
        eligible: false,
        code: 'INCOMPATIBLE_BLOOD',
        forCoordinator: "This donor's blood type (A+) is not compatible with A-.",
        forDonor: 'Your blood type (A+) is not compatible with this request (A-).',
      });
    });

    it('5. different area', () => {
      const donor = makeDonor({ fullName: 'Fadi', bloodType: 'A_NEG', area: DAMASCUS });
      expect(service.checkDonorEligibilityForRequest(donor, request, NOW)).toMatchObject({
        eligible: false,
        code: 'DIFFERENT_AREA',
        forCoordinator: 'This donor is in Damascus, but the request is in Homs.',
        forDonor: 'You can only pledge to requests in your registered area (Damascus).',
      });
    });

    it('keeps `reason` equal to `forCoordinator`', () => {
      const donor = makeDonor({ fullName: 'Lina', bloodType: 'A_POS' });
      const result = service.checkDonorEligibilityForRequest(donor, request, NOW);
      if (result.eligible) throw new Error('expected an ineligible result');
      expect(result.reason).toBe(result.forCoordinator);
    });

    describe('check order: inactive, rest, unavailable, blood, area', () => {
      it('inactive is reported before rest period', () => {
        const donor = makeDonor({ fullName: 'A', bloodType: 'A_NEG', isActive: false, lastDonationDate: daysAgo(5) });
        expect(service.checkDonorEligibilityForRequest(donor, request, NOW)).toMatchObject({ code: 'INACTIVE' });
      });

      it('rest period is reported before unavailable', () => {
        const donor = makeDonor({ fullName: 'B', bloodType: 'A_NEG', isAvailable: false, lastDonationDate: daysAgo(5) });
        expect(service.checkDonorEligibilityForRequest(donor, request, NOW)).toMatchObject({ code: 'REST_PERIOD' });
      });

      it('unavailable is reported before blood type', () => {
        const donor = makeDonor({ fullName: 'C', bloodType: 'A_POS', isAvailable: false });
        expect(service.checkDonorEligibilityForRequest(donor, request, NOW)).toMatchObject({ code: 'UNAVAILABLE' });
      });

      it('blood type is reported before area', () => {
        const donor = makeDonor({ fullName: 'D', bloodType: 'A_POS', area: DAMASCUS });
        expect(service.checkDonorEligibilityForRequest(donor, request, NOW)).toMatchObject({ code: 'INCOMPATIBLE_BLOOD' });
      });
    });
  });

  // ------------------------------------------------------------------ R-7, R-8
  describe('getEligibleDonorsForRequest', () => {
    it('Test table: A- request in Homs ranks Sara, Zaid, Omar; Rami is excluded (rest); Lina is ignored', async () => {
      const donors = [
        makeDonor({ fullName: 'Sara', bloodType: 'A_NEG' }),
        makeDonor({ fullName: 'Omar', bloodType: 'O_NEG', lastDonationDate: daysAgo(120) }),
        makeDonor({ fullName: 'Zaid', bloodType: 'A_NEG', lastDonationDate: daysAgo(90), pledges: [{ id: 'plg-1' }] }),
        makeDonor({ fullName: 'Rami', bloodType: 'O_NEG', lastDonationDate: daysAgo(20) }),
        makeDonor({ fullName: 'Lina', bloodType: 'A_POS' }),
      ];
      const { service: svc, findMany } = buildService(makeRequest('A_NEG'), donors);

      const result = await svc.getEligibleDonorsForRequest('req-101');

      expect(result.eligibleDonors.map((d) => d.id)).toEqual(['dp-sara', 'dp-zaid', 'dp-omar']);
      expect(result.eligibleDonors.map((d) => d.rank)).toEqual([1, 2, 3]);
      expect(result.eligibleDonors.map((d) => d.isExactBloodMatch)).toEqual([true, true, false]);
      expect(result.eligibleDonors.map((d) => d.bloodType)).toEqual(['A-', 'A-', 'O-']);
      expect(result.eligibleDonors.map((d) => d.lastDonationDate)).toEqual([
        null,
        toDateOnlyString(daysAgo(90)),
        toDateOnlyString(daysAgo(120)),
      ]);
      expect(result.eligibleDonors.map((d) => d.hasActivePledgeForThisRequest)).toEqual([false, true, false]);
      expect(result.excludedSummary).toEqual({ restPeriod: 1, unavailable: 0, inactive: 0 });
      expect(result.requestId).toBe('req-101');
      expect(result.bloodTypeNeeded).toBe('A-');
      expect(result.area).toEqual(HOMS);

      // The query only asks for compatible blood types of the request's area.
      const where = findMany.mock.calls[0][0].where;
      expect(where.areaId).toBe('area-homs');
      expect([...where.bloodType.in].sort()).toEqual(['A_NEG', 'O_NEG']);
    });

    it('Test table: two O- donors who never donated -> "Ahmad" ranks before "basel"', async () => {
      const donors = [
        makeDonor({ fullName: 'basel', bloodType: 'O_NEG' }),
        makeDonor({ fullName: 'Ahmad', bloodType: 'O_NEG' }),
      ];
      const { service: svc } = buildService(makeRequest('O_NEG'), donors);

      const result = await svc.getEligibleDonorsForRequest('req-101');

      expect(result.eligibleDonors.map((d) => d.fullName)).toEqual(['Ahmad', 'basel']);
    });

    it('an exact-match donor outranks a compatible donor who has waited longer', async () => {
      const donors = [
        makeDonor({ fullName: 'Omar', bloodType: 'O_NEG' }), // never donated, but not an exact match
        makeDonor({ fullName: 'Zaid', bloodType: 'A_NEG', lastDonationDate: daysAgo(60) }),
      ];
      const { service: svc } = buildService(makeRequest('A_NEG'), donors);

      const result = await svc.getEligibleDonorsForRequest('req-101');

      expect(result.eligibleDonors.map((d) => d.fullName)).toEqual(['Zaid', 'Omar']);
    });

    it('inside the same blood type, the oldest donation comes first and never-donated comes before all', async () => {
      const donors = [
        makeDonor({ fullName: 'Newer', bloodType: 'A_NEG', lastDonationDate: daysAgo(60) }),
        makeDonor({ fullName: 'Older', bloodType: 'A_NEG', lastDonationDate: daysAgo(200) }),
        makeDonor({ fullName: 'Never', bloodType: 'A_NEG' }),
      ];
      const { service: svc } = buildService(makeRequest('A_NEG'), donors);

      const result = await svc.getEligibleDonorsForRequest('req-101');

      expect(result.eligibleDonors.map((d) => d.fullName)).toEqual(['Never', 'Older', 'Newer']);
    });

    it('counts every excluded reason exactly once (inactive wins over rest, rest over unavailable)', async () => {
      const donors = [
        makeDonor({ fullName: 'Sara', bloodType: 'A_NEG' }),
        makeDonor({ fullName: 'Rami', bloodType: 'O_NEG', lastDonationDate: daysAgo(20) }),
        makeDonor({ fullName: 'Huda', bloodType: 'A_NEG', isAvailable: false }),
        makeDonor({ fullName: 'Karim', bloodType: 'O_NEG', isActive: false }),
        makeDonor({ fullName: 'Nada', bloodType: 'O_NEG', isActive: false, lastDonationDate: daysAgo(3) }),
        makeDonor({ fullName: 'Dina', bloodType: 'A_NEG', isAvailable: false, lastDonationDate: daysAgo(3) }),
      ];
      const { service: svc } = buildService(makeRequest('A_NEG'), donors);

      const result = await svc.getEligibleDonorsForRequest('req-101');

      expect(result.eligibleDonors.map((d) => d.fullName)).toEqual(['Sara']);
      // Rami + Dina -> rest period, Huda -> unavailable, Karim + Nada -> inactive
      expect(result.excludedSummary).toEqual({ restPeriod: 2, unavailable: 1, inactive: 2 });
    });

    it('ignores donors from other areas', async () => {
      const donors = [
        makeDonor({ fullName: 'Sara', bloodType: 'A_NEG' }),
        makeDonor({ fullName: 'Fadi', bloodType: 'A_NEG', area: DAMASCUS }),
      ];
      const { service: svc } = buildService(makeRequest('A_NEG'), donors);

      const result = await svc.getEligibleDonorsForRequest('req-101');

      expect(result.eligibleDonors.map((d) => d.fullName)).toEqual(['Sara']);
    });

    it('returns an empty list and zero counts when nobody matches', async () => {
      const { service: svc } = buildService(makeRequest('A_NEG'), []);

      const result = await svc.getEligibleDonorsForRequest('req-101');

      expect(result.eligibleDonors).toEqual([]);
      expect(result.excludedSummary).toEqual({ restPeriod: 0, unavailable: 0, inactive: 0 });
    });

    it('404 when the request does not exist', async () => {
      const { service: svc, findMany } = buildService(null);

      await expect(svc.getEligibleDonorsForRequest('nope')).rejects.toThrow(
        new NotFoundException('Blood request not found.'),
      );
      expect(findMany).not.toHaveBeenCalled();
    });

    it.each(['FULFILLED', 'CANCELLED'] as const)('409 when the request is %s', async (status) => {
      const { service: svc, findMany } = buildService(makeRequest('A_NEG', status));

      await expect(svc.getEligibleDonorsForRequest('req-101')).rejects.toThrow(
        new ConflictException('Eligible donors can only be matched for OPEN requests.'),
      );
      expect(findMany).not.toHaveBeenCalled();
    });
  });
});
