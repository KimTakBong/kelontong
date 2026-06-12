import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  // Used by the Passport local strategy. Returns the user (without password)
  // on success, throws 401 otherwise.
  async validateCredentials(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmailWithPassword(email);
    if (!user) {
      throw new UnauthorizedException('Email atau password salah');
    }

    const matches = await bcrypt.compare(password, user.password);
    if (!matches) {
      throw new UnauthorizedException('Email atau password salah');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Akun Anda tidak aktif');
    }

    delete (user as Partial<User>).password;
    return user;
  }

  async register(dto: RegisterDto): Promise<User> {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException({
        message: 'Validation failed',
        details: [
          { field: 'confirmPassword', message: 'Konfirmasi password tidak cocok' },
        ],
      });
    }

    // New registrations are always staff (admins are promoted by an admin).
    return this.usersService.create({
      name: dto.name,
      email: dto.email,
      password: dto.password,
      role: 'staff',
    });
  }
}
