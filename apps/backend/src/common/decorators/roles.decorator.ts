import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../users/entities/user.entity';

export const ROLES_KEY = 'roles';

// Restrict a route to one or more roles. Enforced by RolesGuard.
//   @Roles('admin')
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
