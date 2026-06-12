import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { User, UserRole } from '../../users/entities/user.entity';

// Enforces @Roles(...) metadata. Runs after AuthenticatedGuard, so req.user is
// guaranteed present for any route that declares required roles.
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as User | undefined;

    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Anda tidak memiliki akses untuk aksi ini');
    }
    return true;
  }
}
