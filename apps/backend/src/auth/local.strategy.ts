import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from './auth.service';
import { User } from '../users/entities/user.entity';

// Local strategy: authenticate with email + password. We map Passport's default
// `username` field to `email`.
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({ usernameField: 'email', passwordField: 'password' });
  }

  // Return value is attached to req.user and serialized into the session.
  validate(email: string, password: string): Promise<User> {
    return this.authService.validateCredentials(email, password);
  }
}
