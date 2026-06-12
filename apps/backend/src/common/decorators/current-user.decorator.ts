import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../users/entities/user.entity';

// Inject the authenticated user (populated by Passport on req.user).
//   handler(@CurrentUser() user: User)
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
