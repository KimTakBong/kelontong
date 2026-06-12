import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepo: Repository<Category>,
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
  ) {}

  findAll(): Promise<Category[]> {
    return this.categoriesRepo.find({ order: { id: 'ASC' } });
  }

  // Used by ProductsService to validate categoryId on create/update.
  async findById(id: string): Promise<Category> {
    const category = await this.categoriesRepo.findOne({ where: { id } });
    if (!category) throw new NotFoundException('Kategori tidak ditemukan');
    return category;
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    const existing = await this.categoriesRepo.findOne({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException('Kategori sudah ada');
    }
    return this.categoriesRepo.save(this.categoriesRepo.create(dto));
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findById(id);
    if (dto.name && dto.name !== category.name) {
      const existing = await this.categoriesRepo.findOne({
        where: { name: dto.name },
      });
      if (existing) {
        throw new ConflictException('Kategori sudah ada');
      }
      category.name = dto.name;
    }
    return this.categoriesRepo.save(category);
  }

  async remove(id: string): Promise<{ message: string }> {
    const category = await this.findById(id);
    const productCount = await this.productsRepo.count({
      where: { categoryId: id },
      withDeleted: true,
    });
    if (productCount > 0) {
      throw new ConflictException(
        'Kategori masih digunakan oleh produk dan tidak bisa dihapus',
      );
    }
    await this.categoriesRepo.remove(category);
    return { message: 'Kategori berhasil dihapus' };
  }
}
