export type Role = 'COORDINATOR' | 'DONOR';

export type BloodType = 'O-' | 'O+' | 'A-' | 'A+' | 'B-' | 'B+' | 'AB-' | 'AB+';

export interface Area {
  id: string;
  name: string;
}

export interface AuthUser {
  id: string;
  phone: string;
  email: string | null;
  role: Role;
  isActive: boolean;
  donorProfile: {
    id: string;
    fullName: string;
    bloodType: BloodType;
    area: Area;
    isAvailable: boolean;
  } | null;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export interface SignUpPayload {
  fullName: string;
  phone: string;
  email?: string;
  password: string;
  bloodType: BloodType;
  areaId: string;
}

export interface SignInPayload {
  identifier: string;
  password: string;
}
