import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Alat Tulis' })
  @IsString()
  @IsNotEmpty({ message: 'Nama kategori wajib diisi' })
  @MaxLength(100, { message: 'Nama maksimal 100 karakter' })
  name: string;
}
