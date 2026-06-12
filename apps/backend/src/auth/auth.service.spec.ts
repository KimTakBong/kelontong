import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<Pick<UsersService, 'findByEmailWithPassword' | 'create'>>;

  beforeEach(() => {
    usersService = {
      findByEmailWithPassword: jest.fn(),
      create: jest.fn(),
    };
    service = new AuthService(usersService as unknown as UsersService);
  });

  describe('validateCredentials', () => {
    it('returns the user (without password) on valid credentials', async () => {
      const hash = await bcrypt.hash('admin123', 10);
      usersService.findByEmailWithPassword.mockResolvedValue({
        id: 'u1',
        email: 'admin@klontong.com',
        password: hash,
        role: 'admin',
        isActive: true,
      } as User);

      const result = await service.validateCredentials('admin@klontong.com', 'admin123');

      expect(result.id).toBe('u1');
      expect((result as Partial<User>).password).toBeUndefined();
    });

    it('throws 401 when the password is wrong', async () => {
      const hash = await bcrypt.hash('correct', 10);
      usersService.findByEmailWithPassword.mockResolvedValue({
        id: 'u1',
        password: hash,
        isActive: true,
      } as User);

      await expect(
        service.validateCredentials('admin@klontong.com', 'wrong'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws 401 when the user does not exist', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(null);

      await expect(
        service.validateCredentials('ghost@klontong.com', 'whatever'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('rejects when password and confirmation differ', async () => {
      await expect(
        service.register({
          name: 'John',
          email: 'john@example.com',
          password: 'password123',
          confirmPassword: 'different',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(usersService.create).not.toHaveBeenCalled();
    });

    it('creates a staff user when input is valid', async () => {
      usersService.create.mockResolvedValue({ id: 'u2', role: 'staff' } as User);

      await service.register({
        name: 'John',
        email: 'john@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      });

      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'john@example.com', role: 'staff' }),
      );
    });
  });
});
