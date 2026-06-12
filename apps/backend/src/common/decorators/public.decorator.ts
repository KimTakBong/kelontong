import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

// Opt a route out of the global authentication guard (e.g. login, register).
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
