import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  @IsUUID(undefined, { message: 'categoryId harus berupa UUID' })
  categoryId: string;

  @ApiProperty({ example: 'MHZVTK', maxLength: 20 })
  @IsString()
  @IsNotEmpty({ message: 'SKU wajib diisi' })
  @MaxLength(20, { message: 'SKU maksimal 20 karakter' })
  @Matches(/^[A-Z0-9]+$/, {
    message: 'SKU hanya boleh huruf kapital dan angka',
  })
  sku: string;

  @ApiProperty({ example: 'Ciki Ciki' })
  @IsString()
  @MinLength(2, { message: 'Nama minimal 2 karakter' })
  @MaxLength(100, { message: 'Nama maksimal 100 karakter' })
  name: string;

  @ApiPropertyOptional({ example: 'A popular snack sold by our store' })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Deskripsi maksimal 1000 karakter' })
  description?: string | null;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0, { message: 'Berat tidak boleh negatif' })
  weight?: number | null;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @Type(() => Number)
  @Min(0, { message: 'Lebar tidak boleh negatif' })
  width?: number | null;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @Type(() => Number)
  @Min(0, { message: 'Panjang tidak boleh negatif' })
  length?: number | null;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @Type(() => Number)
  @Min(0, { message: 'Tinggi tidak boleh negatif' })
  height?: number | null;

  @ApiPropertyOptional({ example: 'http://localhost:3001/uploads/abc.jpg' })
  @IsOptional()
  // require_tld:false so locally-served upload URLs (http://localhost:3001/...)
  // are accepted, not just public FQDNs.
  @IsUrl({ require_tld: false }, { message: 'Format URL gambar tidak valid' })
  @MaxLength(500)
  image?: string | null;

  @ApiProperty({ example: 30000 })
  @Type(() => Number)
  @IsInt({ message: 'Harga harus berupa angka' })
  @Min(0, { message: 'Harga tidak boleh negatif' })
  price: number;

  @ApiProperty({ example: 120 })
  @Type(() => Number)
  @IsInt({ message: 'Stok harus berupa angka' })
  @Min(0, { message: 'Stok tidak boleh negatif' })
  stock: number;
}
