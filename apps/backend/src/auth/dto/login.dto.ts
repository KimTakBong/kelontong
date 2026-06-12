import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@klontong.com' })
  @IsEmail({}, { message: 'Format email tidak valid' })
  email: string;

  @ApiProperty({ example: 'admin123' })
  @IsString()
  @IsNotEmpty({ message: 'Password wajib diisi' })
  password: string;
}
