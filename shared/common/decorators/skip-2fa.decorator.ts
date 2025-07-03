// services/auth-service/src/auth/decorators/skip-2fa.decorator.ts

import { SetMetadata } from '@nestjs/common';

export const SKIP_2FA_KEY = 'skip2FA';
export const Skip2FA = () => SetMetadata(SKIP_2FA_KEY, true);