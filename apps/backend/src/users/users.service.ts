import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

const BCRYPT_ROUNDS = 10;

interface CreateUserParams {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  findAll(): Promise<User[]> {
    return this.usersRepo.find({ order: { createdAt: 'ASC' } });
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User tidak ditemukan');
    return user;
  }

  // Used by the auth flow — explicitly selects the password (excluded by default).
  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  async create(params: CreateUserParams): Promise<User> {
    const existing = await this.usersRepo.findOne({
      where: { email: params.email },
    });
    if (existing) {
      throw new ConflictException('Email sudah terdaftar');
    }

    const passwordHash = await bcrypt.hash(params.password, BCRYPT_ROUNDS);
    const user = this.usersRepo.create({
      name: params.name,
      email: params.email,
      password: passwordHash,
      role: params.role ?? 'staff',
    });

    const saved = await this.usersRepo.save(user);
    // Never return the hash to callers.
    delete (saved as Partial<User>).password;
    return saved;
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    Object.assign(user, dto);
    return this.usersRepo.save(user);
  }

  // Hard delete is safe: api_logs has no FK to users (logs survive deletion),
  // so no orphan/constraint issues.
  async remove(id: string): Promise<void> {
    const user = await this.findById(id);
    await this.usersRepo.remove(user);
  }
}
