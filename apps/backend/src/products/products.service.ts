import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { CategoriesService } from '../categories/categories.service';
import { PaginatedResult } from '../common/dto/pagination.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { ProductResponse, toProductResponse } from './products.presenter';

// Map sortBy (API) → entity column, whitelisted to avoid SQL injection via sort.
const SORT_COLUMN: Record<string, string> = {
  name: 'product.name',
  price: 'product.price',
  stock: 'product.stock',
  createdAt: 'product.createdAt',
};

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
    private readonly categoriesService: CategoriesService,
  ) {}

  async findAll(
    query: QueryProductsDto,
  ): Promise<PaginatedResult<ProductResponse>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';

    const qb = this.productsRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      // Include soft-deleted rows so we can decide per the status filter below.
      .withDeleted();

    if (query.search) {
      // Case-insensitive match on name OR sku.
      qb.andWhere(
        new Brackets((w) => {
          w.where('product.name ILIKE :search', {
            search: `%${query.search}%`,
          }).orWhere('product.sku ILIKE :search', {
            search: `%${query.search}%`,
          });
        }),
      );
    }

    if (query.categoryId !== undefined) {
      qb.andWhere('product.categoryId = :categoryId', {
        categoryId: query.categoryId,
      });
    }

    // Status filter is about archived state (soft delete), which is what the
    // admin UI's "Aktif / Arsip" really means:
    //   isActive=true  → active (not archived)
    //   isActive=false → archived only
    //   undefined      → all (active + archived)
    if (query.isActive === true) {
      qb.andWhere('product.deletedAt IS NULL');
    } else if (query.isActive === false) {
      qb.andWhere('product.deletedAt IS NOT NULL');
    }

    qb.orderBy(SORT_COLUMN[sortBy], sortOrder === 'asc' ? 'ASC' : 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();
    return new PaginatedResult(items.map(toProductResponse), total, page, limit);
  }

  async findOne(id: string): Promise<ProductResponse> {
    const product = await this.getEntityOrFail(id);
    return toProductResponse(product);
  }

  async create(dto: CreateProductDto): Promise<ProductResponse> {
    await this.categoriesService.findById(dto.categoryId);
    await this.assertSkuUnique(dto.sku);

    const product = this.productsRepo.create(dto);
    const saved = await this.productsRepo.save(product);
    return this.findOne(saved.id);
  }

  async update(id: string, dto: UpdateProductDto): Promise<ProductResponse> {
    const product = await this.getEntityOrFail(id);

    if (dto.categoryId !== undefined) {
      await this.categoriesService.findById(dto.categoryId);
    }
    if (dto.sku !== undefined && dto.sku !== product.sku) {
      await this.assertSkuUnique(dto.sku);
    }

    Object.assign(product, dto);
    await this.productsRepo.save(product);
    return this.findOne(id);
  }

  // Soft delete: sets deleted_at. The product stays in the DB and is viewable
  // via the "Arsip" filter; restore() reverses it.
  async archive(id: string): Promise<{ message: string }> {
    const product = await this.getEntityOrFail(id);
    if (product.deletedAt) {
      return { message: 'Produk sudah diarsipkan' };
    }
    await this.productsRepo.softDelete(id);
    return { message: 'Produk berhasil diarsipkan' };
  }

  // Permanent delete: only allowed for already-archived products, since
  // archive (soft delete) is the normal removal path.
  async hardDelete(id: string): Promise<{ message: string }> {
    const product = await this.getEntityOrFail(id);
    if (!product.deletedAt) {
      throw new BadRequestException(
        'Produk harus diarsipkan sebelum dapat dihapus permanen',
      );
    }
    await this.productsRepo.remove(product);
    return { message: 'Produk berhasil dihapus permanen' };
  }

  // Un-archive: clears deleted_at.
  async restore(id: string): Promise<ProductResponse> {
    const product = await this.getEntityOrFail(id);
    if (product.deletedAt) {
      await this.productsRepo.restore(id);
    }
    return this.findOne(id);
  }

  // withDeleted so archived products are still viewable (detail / restore).
  private async getEntityOrFail(id: string): Promise<Product> {
    const product = await this.productsRepo.findOne({
      where: { id },
      relations: { category: true },
      withDeleted: true,
    });
    if (!product) throw new NotFoundException('Produk tidak ditemukan');
    return product;
  }

  private async assertSkuUnique(sku: string): Promise<void> {
    // withDeleted: a SKU used by an archived product is still taken (unique idx).
    const existing = await this.productsRepo.findOne({
      where: { sku },
      withDeleted: true,
    });
    if (existing) {
      throw new ConflictException('SKU sudah digunakan');
    }
  }
}
