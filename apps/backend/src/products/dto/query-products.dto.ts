import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export const PRODUCT_SORT_FIELDS = [
  'name',
  'price',
  'stock',
  'createdAt',
] as const;
export type ProductSortField = (typeof PRODUCT_SORT_FIELDS)[number];

export class QueryProductsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Cari berdasarkan nama atau SKU' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter kategori' })
  @IsOptional()
  @IsUUID(undefined, { message: 'categoryId harus berupa UUID' })
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Filter status aktif' })
  @IsOptional()
  // Query params arrive as strings — coerce "true"/"false" into booleans.
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ enum: PRODUCT_SORT_FIELDS, default: 'createdAt' })
  @IsOptional()
  @IsIn(PRODUCT_SORT_FIELDS)
  sortBy?: ProductSortField = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
