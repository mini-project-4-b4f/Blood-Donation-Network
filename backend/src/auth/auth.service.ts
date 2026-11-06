import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { ApiBloodType } from '../common/constants';
import {
  normalizeEmail,
  normalizePhone,
  toApiBloodType,
  toPrismaBloodType,
} from '../common/normalize.util';
import { AreasService } from '../areas/areas.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthResponse, AuthUser, JwtPayload } from './auth.types';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';

type UserWithProfile = Prisma.UserGetPayload<{
  include: { donorProfile: { include: { area: true } } };
}>;

const INVALID_CREDENTIALS = 'Invalid credentials. Please check your phone/email and password.';
const PHONE_TAKEN = 'An account with this phone number is already registered.';
const EMAIL_TAKEN = 'An account with this email address is already registered.';

// Used to spend the same time on unknown identifiers as on wrong passwords.
const DUMMY_HASH = bcrypt.hashSync('invalid-credentials-placeholder', 10);

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly areasService: AreasService,
    private readonly jwtService: JwtService,
  ) {}

  /** POST /auth/sign-up: registers a donor (User + DonorProfile in one transaction). */
  async signUp(dto: SignUpDto): Promise<AuthResponse> {
    // Part 2 rules, in order: area, phone, email.
    await this.areasService.findByIdOrThrow(dto.areaId);

    const phoneOwner = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (phoneOwner) throw new ConflictException(PHONE_TAKEN);

    if (dto.email) {
      const emailOwner = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (emailOwner) throw new ConflictException(EMAIL_TAKEN);
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    let user: UserWithProfile;
    try {
      user = await this.prisma.$transaction((tx) =>
        tx.user.create({
          data: {
            phone: dto.phone,
            email: dto.email ?? null,
            passwordHash,
            role: Role.DONOR,
            donorProfile: {
              create: {
                fullName: dto.fullName,
                bloodType: toPrismaBloodType(dto.bloodType as ApiBloodType),
                areaId: dto.areaId,
              },
            },
          },
          include: { donorProfile: { include: { area: true } } },
        }),
      );
    } catch (error) {
      // Two sign-ups racing for the same phone/email: the unique index decides.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const target = String(error.meta?.target ?? '');
        throw new ConflictException(target.includes('email') ? EMAIL_TAKEN : PHONE_TAKEN);
      }
      throw error;
    }

    return { accessToken: await this.signToken(user), user: this.toAuthUser(user) };
  }

  /** POST /auth/sign-in: phone or email + password. Never reveals which part was wrong. */
  async signIn(dto: SignInDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { phone: normalizePhone(dto.identifier) },
          { email: normalizeEmail(dto.identifier) },
        ],
      },
      include: { donorProfile: { include: { area: true } } },
    });

    const passwordMatches = await bcrypt.compare(dto.password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !passwordMatches) throw new UnauthorizedException(INVALID_CREDENTIALS);

    if (!user.isActive) throw new ForbiddenException('This account has been deactivated.');

    return { accessToken: await this.signToken(user), user: this.toAuthUser(user) };
  }

  /** GET /auth/me */
  async getMe(userId: string): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { donorProfile: { include: { area: true } } },
    });
    if (!user) throw new UnauthorizedException('Authentication required. Please sign in.');
    return this.toAuthUser(user);
  }

  private signToken(user: { id: string; role: Role }): Promise<string> {
    const payload: JwtPayload = { sub: user.id, role: user.role };
    return this.jwtService.signAsync(payload);
  }

  private toAuthUser(user: UserWithProfile): AuthUser {
    const profile = user.donorProfile;
    return {
      id: user.id,
      phone: user.phone,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      donorProfile: profile
        ? {
            id: profile.id,
            fullName: profile.fullName,
            bloodType: toApiBloodType(profile.bloodType),
            area: { id: profile.area.id, name: profile.area.name },
            isAvailable: profile.isAvailable,
          }
        : null,
    };
  }
}
