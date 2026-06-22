import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY } from './auth.constants';

/** Marks a route as accessible without authentication. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
