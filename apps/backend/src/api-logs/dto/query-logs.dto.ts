import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsISO8601, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class QueryLogsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter partial path, contoh: /products' })
  @IsOptional()
  @IsString()
  path?: string;

  @ApiPropertyOptional({ description: 'Filter exact status code' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  statusCode?: number;

  @ApiPropertyOptional({ description: 'Filter by user id' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: 'ISO 8601, contoh: 2025-01-01T00:00:00Z' })
  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @ApiPropertyOptional({ description: 'ISO 8601, contoh: 2025-01-31T23:59:59Z' })
  @IsOptional()
  @IsISO8601()
  endDate?: string;
}
