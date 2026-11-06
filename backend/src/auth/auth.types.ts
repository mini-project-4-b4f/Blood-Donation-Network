import { Request } from 'express';
import { Role } from '@prisma/client';
import { ApiBloodType } from '../common/constants';

/** JWT payload: `{ sub: user.id, role: user.role }`. */
export interface JwtPayload {
  sub: string;
  role: Role;
}

/** What the guards attach to `request.user`. */
export interface AuthenticatedUser {
  id: string;
  role: Role;
}

export type AuthenticatedRequest = Request & { user?: AuthenticatedUser };

export interface AreaItem {
  id: string;
  name: string;
}

/** docs/API.md section 4.2 */
export interface AuthUser {
  id: string;
  phone: string;
  email: string | null;
  role: Role;
  isActive: boolean;
  donorProfile: {
    id: string;
    fullName: string;
    bloodType: ApiBloodType;
    area: AreaItem;
    isAvailable: boolean;
  } | null;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}
