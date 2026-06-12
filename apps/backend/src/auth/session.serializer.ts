import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

// Controls what goes into the session cookie store. We persist only the user id
// and re-hydrate the full user on each request (so role/status changes take
// effect without forcing re-login).
@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(private readonly usersService: UsersService) {
    super();
  }

  serializeUser(user: User, done: (err: Error | null, id: string) => void): void {
    done(null, user.id);
  }

  async deserializeUser(
    id: string,
    done: (err: Error | null, user: User | null) => void,
  ): Promise<void> {
    try {
      const user = await this.usersService.findById(id);
      done(null, user);
    } catch {
      // User no longer exists / inactive — treat as no session.
      done(null, null);
    }
  }
}
