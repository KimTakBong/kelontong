import { PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateProductDto } from './create-product.dto';

// All create fields become optional, plus isActive can be toggled on edit.
export class UpdateProductDto extends PartialType(CreateProductDto) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
