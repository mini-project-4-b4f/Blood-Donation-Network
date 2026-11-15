import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

/** Restricts an endpoint to the given roles, e.g. `@Roles('COORDINATOR')`. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
