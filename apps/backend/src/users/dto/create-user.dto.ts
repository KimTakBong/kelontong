import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserRole } from '../entities/user.entity';

// Admin-initiated user creation (distinct from public self-registration).
export class CreateUserDto {
  @ApiProperty({ example: 'Budi Santoso' })
  @IsString()
  @IsNotEmpty({ message: 'Nama wajib diisi' })
  @MaxLength(100, { message: 'Nama maksimal 100 karakter' })
  name: string;

  @ApiProperty({ example: 'budi@klontong.com' })
  @IsEmail({}, { message: 'Format email tidak valid' })
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  password: string;

  @ApiPropertyOptional({ enum: ['admin', 'staff'], default: 'staff' })
  @IsOptional()
  @IsIn(['admin', 'staff'], { message: 'Role harus admin atau staff' })
  role?: UserRole;
}
