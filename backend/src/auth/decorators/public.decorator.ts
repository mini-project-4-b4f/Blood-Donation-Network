import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Marks an endpoint as open to everyone (no token needed). Public endpoints return public fields only. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
