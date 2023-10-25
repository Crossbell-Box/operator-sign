import {
  SetMetadata,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { OpSignUser } from '@prisma/client';
import { IS_PUBLIC_KEY } from './siwe.constants';

export const CurrentUser = createParamDecorator(
  (_: undefined, context: ExecutionContext): OpSignUser => {
    const request = context.switchToHttp().getRequest();
    const user = request.user as OpSignUser;
    return user;
  },
);

/** if non-login user can access this endpoint */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const ApiBearerAuthSiwe = () => ApiBearerAuth('siwe');
