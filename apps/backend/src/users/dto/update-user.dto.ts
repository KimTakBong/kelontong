import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Budi Santoso' })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Nama tidak boleh kosong' })
  @MaxLength(100, { message: 'Nama maksimal 100 karakter' })
  name?: string;

  @ApiPropertyOptional({ enum: ['admin', 'staff'] })
  @IsOptional()
  @IsIn(['admin', 'staff'], { message: 'Role harus admin atau staff' })
  role?: UserRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
