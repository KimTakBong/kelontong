import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty({ message: 'Nama wajib diisi' })
  @MaxLength(100, { message: 'Nama maksimal 100 karakter' })
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail({}, { message: 'Format email tidak valid' })
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  password: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty({ message: 'Konfirmasi password wajib diisi' })
  confirmPassword: string;
}
