import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'List produk (pagination, search, filter, sort)' })
  findAll(@Query() query: QueryProductsDto) {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail produk' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Buat produk baru (admin & staff)' })
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edit produk (admin & staff)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Arsip / soft delete produk (admin only)' })
  archive(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.archive(id);
  }

  @Patch(':id/restore')
  @Roles('admin')
  @ApiOperation({ summary: 'Pulihkan produk yang diarsipkan (admin only)' })
  restore(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.restore(id);
  }

  @Delete(':id/permanent')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Hapus produk permanen (admin only, harus sudah diarsipkan)',
  })
  hardDelete(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.hardDelete(id);
  }
}
