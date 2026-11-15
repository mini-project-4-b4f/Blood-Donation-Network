import 'dotenv/config';
import { PledgeStatus, PrismaClient, RequestStatus, Role, Urgency } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { ApiBloodType } from '../src/common/constants';
import { toPrismaBloodType } from '../src/common/normalize.util';

const prisma = new PrismaClient();

const COORDINATOR_PASSWORD = 'Coordinator123!';
const DONOR_PASSWORD = 'DonorPassword123';

/** Local-midnight date `n` days ago (matches toDateOnlyString, which uses local time). */
function daysAgo(n: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

/** Timestamp `n` hours ago. */
function hoursAgo(n: number): Date {
  return new Date(Date.now() - n * 60 * 60 * 1000);
}

const AREAS = [
  { id: 'area-homs', name: 'Homs' },
  { id: 'area-damascus', name: 'Damascus' },
  { id: 'area-aleppo', name: 'Aleppo' },
  { id: 'area-latakia', name: 'Latakia' },
  { id: 'area-hama', name: 'Hama' },
  { id: 'area-tartus', name: 'Tartus' },
];

interface DonorSeed {
  key: string;
  fullName: string;
  phone: string;
  email?: string;
  bloodType: ApiBloodType;
  areaId: string;
  isAvailable?: boolean;
  isActive?: boolean;
  lastDonationDaysAgo?: number;
}

// 24 donors covering all 8 blood types.
// lastDonationDaysAgo is set ONLY for donors that also have a historical Donation record below,
// so the data stays consistent.
const DONORS: DonorSeed[] = [
  // ---- Homs (the Section 6 scenario) ----
  { key: 'sara', fullName: 'Sara Al-Khatib', phone: '0933112233', email: 'sara@example.com', bloodType: 'A-', areaId: 'area-homs' }, // eligible, never donated
  { key: 'zaid', fullName: 'Zaid Haddad', phone: '0933000002', bloodType: 'A-', areaId: 'area-homs', lastDonationDaysAgo: 90 },
  { key: 'omar', fullName: 'Omar Mansour', phone: '0944556677', bloodType: 'O-', areaId: 'area-homs', lastDonationDaysAgo: 120 },
  { key: 'rami', fullName: 'Rami Darwish', phone: '0933000004', bloodType: 'O-', areaId: 'area-homs', lastDonationDaysAgo: 20 }, // REST_PERIOD
  { key: 'lina', fullName: 'Lina Saleh', phone: '0933000005', bloodType: 'A+', areaId: 'area-homs' },
  { key: 'huda', fullName: 'Huda Nasser', phone: '0933000006', bloodType: 'A-', areaId: 'area-homs', isAvailable: false }, // UNAVAILABLE
  { key: 'karim', fullName: 'Karim Ibrahim', phone: '0933000007', bloodType: 'O-', areaId: 'area-homs', isActive: false, isAvailable: false }, // INACTIVE
  { key: 'basel', fullName: 'Basel Youssef', phone: '0933000008', bloodType: 'O+', areaId: 'area-homs' },
  { key: 'ahmad', fullName: 'Ahmad Kassem', phone: '0933000009', bloodType: 'B+', areaId: 'area-homs' },
  { key: 'maya', fullName: 'Maya Ghanem', phone: '0933000010', bloodType: 'AB-', areaId: 'area-homs' },
  // ---- Damascus ----
  { key: 'nour', fullName: 'Nour Ali', phone: '0933000011', bloodType: 'B-', areaId: 'area-damascus' },
  { key: 'tarek', fullName: 'Tarek Mahmoud', phone: '0933000012', bloodType: 'AB+', areaId: 'area-damascus', lastDonationDaysAgo: 15 }, // REST_PERIOD
  { key: 'dana', fullName: 'Dana Khoury', phone: '0933000013', bloodType: 'O+', areaId: 'area-damascus' },
  { key: 'fadi', fullName: 'Fadi Rizk', phone: '0933000014', bloodType: 'A+', areaId: 'area-damascus' },
  { key: 'reem', fullName: 'Reem Haidar', phone: '0933000015', bloodType: 'O-', areaId: 'area-damascus', isAvailable: false }, // UNAVAILABLE
  { key: 'samer', fullName: 'Samer Aziz', phone: '0933000016', bloodType: 'B+', areaId: 'area-damascus' },
  // ---- Aleppo ----
  { key: 'hiba', fullName: 'Hiba Sabbagh', phone: '0933000017', bloodType: 'A-', areaId: 'area-aleppo' },
  { key: 'yamen', fullName: 'Yamen Orfali', phone: '0933000018', bloodType: 'O+', areaId: 'area-aleppo' },
  { key: 'jana', fullName: 'Jana Mardini', phone: '0933000019', bloodType: 'AB+', areaId: 'area-aleppo' },
  // ---- Latakia ----
  { key: 'wael', fullName: 'Wael Jaber', phone: '0933000020', bloodType: 'B-', areaId: 'area-latakia' },
  { key: 'rana', fullName: 'Rana Ismail', phone: '0933000021', bloodType: 'O-', areaId: 'area-latakia' },
  // ---- Hama ----
  { key: 'mazen', fullName: 'Mazen Farah', phone: '0933000022', bloodType: 'A+', areaId: 'area-hama' },
  { key: 'salma', fullName: 'Salma Hamdan', phone: '0933000023', bloodType: 'AB-', areaId: 'area-hama' },
  // ---- Tartus ----
  { key: 'ghassan', fullName: 'Ghassan Daoud', phone: '0933000024', bloodType: 'B+', areaId: 'area-tartus' },
];

async function clearDatabase(): Promise<void> {
  await prisma.donation.deleteMany();
  await prisma.pledge.deleteMany();
  await prisma.bloodRequest.deleteMany();
  await prisma.donorProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.area.deleteMany();
}

async function main(): Promise<void> {
  await clearDatabase();

  // ---------------- Areas ----------------
  await prisma.area.createMany({ data: AREAS });

  // ---------------- Coordinators ----------------
  const coordinatorHash = await bcrypt.hash(COORDINATOR_PASSWORD, 10);
  await prisma.user.create({
    data: {
      id: 'u-coord-1',
      email: 'coordinator.homs@bloodnet.sy',
      phone: '0911000001',
      passwordHash: coordinatorHash,
      role: Role.COORDINATOR,
    },
  });
  await prisma.user.create({
    data: {
      id: 'u-coord-2',
      email: 'coordinator.damascus@bloodnet.sy',
      phone: '0911000002',
      passwordHash: coordinatorHash,
      role: Role.COORDINATOR,
    },
  });

  // ---------------- Donors ----------------
  const donorHash = await bcrypt.hash(DONOR_PASSWORD, 10);
  for (const donor of DONORS) {
    await prisma.user.create({
      data: {
        id: `u-donor-${donor.key}`,
        email: donor.email ?? null,
        phone: donor.phone,
        passwordHash: donorHash,
        role: Role.DONOR,
        isActive: donor.isActive ?? true,
        donorProfile: {
          create: {
            id: `dp-${donor.key}`,
            fullName: donor.fullName,
            bloodType: toPrismaBloodType(donor.bloodType),
            areaId: donor.areaId,
            isAvailable: donor.isAvailable ?? true,
            lastDonationDate:
              donor.lastDonationDaysAgo !== undefined ? daysAgo(donor.lastDonationDaysAgo) : null,
          },
        },
      },
    });
  }

  // ---------------- Blood requests (6) ----------------
  // 1) OPEN / CRITICAL - the Section 6 scenario: A-, 3 units, Homs
  await prisma.bloodRequest.create({
    data: {
      id: 'req-101',
      patientReference: 'HOMS-ICU-402',
      bloodType: toPrismaBloodType('A-'),
      unitsRequired: 3,
      unitsCollected: 0,
      areaId: 'area-homs',
      urgency: Urgency.CRITICAL,
      status: RequestStatus.OPEN,
      hospital: 'Central Blood Bank Homs',
      note: 'Emergency surgery in Ward 3.',
      createdById: 'u-coord-1',
      createdAt: hoursAgo(2),
    },
  });

  // 2) OPEN / HIGH - AB+, 3 units, Damascus, 1 unit already collected (Tarek)
  await prisma.bloodRequest.create({
    data: {
      id: 'req-102',
      patientReference: 'DAM-ER-118',
      bloodType: toPrismaBloodType('AB+'),
      unitsRequired: 3,
      unitsCollected: 1,
      areaId: 'area-damascus',
      urgency: Urgency.HIGH,
      status: RequestStatus.OPEN,
      hospital: 'Damascus University Hospital',
      note: 'Trauma patient, ongoing transfusion.',
      createdById: 'u-coord-2',
      createdAt: daysAgo(16),
    },
  });

  // 3) OPEN / NORMAL - A-, 2 units, Aleppo, with an active pledge (Hiba)
  await prisma.bloodRequest.create({
    data: {
      id: 'req-103',
      patientReference: 'ALP-ONC-077',
      bloodType: toPrismaBloodType('A-'),
      unitsRequired: 2,
      unitsCollected: 0,
      areaId: 'area-aleppo',
      urgency: Urgency.NORMAL,
      status: RequestStatus.OPEN,
      hospital: 'Aleppo Blood Bank',
      note: null,
      createdById: 'u-coord-1',
      createdAt: daysAgo(1),
    },
  });

  // 4) FULFILLED - O-, 1 unit, Homs (Rami donated 20 days ago)
  await prisma.bloodRequest.create({
    data: {
      id: 'req-104',
      patientReference: 'HOMS-SURG-310',
      bloodType: toPrismaBloodType('O-'),
      unitsRequired: 1,
      unitsCollected: 1,
      areaId: 'area-homs',
      urgency: Urgency.HIGH,
      status: RequestStatus.FULFILLED,
      hospital: 'Central Blood Bank Homs',
      createdById: 'u-coord-1',
      createdAt: daysAgo(21),
    },
  });

  // 5) FULFILLED - A-, 2 units, Homs (Omar and Zaid), one pledge RELEASED (Huda)
  await prisma.bloodRequest.create({
    data: {
      id: 'req-105',
      patientReference: 'HOMS-ICU-251',
      bloodType: toPrismaBloodType('A-'),
      unitsRequired: 2,
      unitsCollected: 2,
      areaId: 'area-homs',
      urgency: Urgency.CRITICAL,
      status: RequestStatus.FULFILLED,
      hospital: 'Al-Watani Hospital Homs',
      createdById: 'u-coord-1',
      createdAt: daysAgo(125),
    },
  });

  // 6) CANCELLED - B-, 2 units, Latakia, one pledge RELEASED (Wael)
  await prisma.bloodRequest.create({
    data: {
      id: 'req-106',
      patientReference: 'LAT-PED-034',
      bloodType: toPrismaBloodType('B-'),
      unitsRequired: 2,
      unitsCollected: 0,
      areaId: 'area-latakia',
      urgency: Urgency.NORMAL,
      status: RequestStatus.CANCELLED,
      hospital: 'Latakia Blood Bank',
      cancelReason: 'Patient transferred to another hospital.',
      createdById: 'u-coord-2',
      createdAt: daysAgo(10),
    },
  });

  // ---------------- Historical donations (consistent with unitsCollected / lastDonationDate) ----------------
  await prisma.donation.createMany({
    data: [
      { id: 'don-901', donorId: 'dp-tarek', requestId: 'req-102', recordedById: 'u-coord-2', donationDate: daysAgo(15), units: 1 },
      { id: 'don-902', donorId: 'dp-rami', requestId: 'req-104', recordedById: 'u-coord-1', donationDate: daysAgo(20), units: 1 },
      { id: 'don-903', donorId: 'dp-omar', requestId: 'req-105', recordedById: 'u-coord-1', donationDate: daysAgo(120), units: 1 },
      { id: 'don-904', donorId: 'dp-zaid', requestId: 'req-105', recordedById: 'u-coord-1', donationDate: daysAgo(90), units: 1 },
    ],
  });

  // ---------------- Pledges (PLEDGED / COMPLETED / RELEASED) ----------------
  await prisma.pledge.createMany({
    data: [
      { id: 'plg-501', donorId: 'dp-hiba', requestId: 'req-103', status: PledgeStatus.PLEDGED },
      { id: 'plg-502', donorId: 'dp-tarek', requestId: 'req-102', status: PledgeStatus.COMPLETED },
      { id: 'plg-503', donorId: 'dp-rami', requestId: 'req-104', status: PledgeStatus.COMPLETED },
      { id: 'plg-504', donorId: 'dp-zaid', requestId: 'req-105', status: PledgeStatus.COMPLETED },
      { id: 'plg-505', donorId: 'dp-huda', requestId: 'req-105', status: PledgeStatus.RELEASED },
      { id: 'plg-506', donorId: 'dp-wael', requestId: 'req-106', status: PledgeStatus.RELEASED },
    ],
  });

  // eslint-disable-next-line no-console
  console.log(
    `Seed complete: ${AREAS.length} areas, 2 coordinators, ${DONORS.length} donors, 6 requests.`,
  );
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
