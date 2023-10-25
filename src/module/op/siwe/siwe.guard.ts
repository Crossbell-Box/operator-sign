import { Injectable, ExecutionContext } from '@nestjs/common';
import { IS_PUBLIC_KEY, SIWE_STRATEGY_NAME } from './siwe.constants';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class SiweAuthGuard extends AuthGuard(SIWE_STRATEGY_NAME) {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    return super.canActivate(context);
  }
}
