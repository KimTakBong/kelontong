import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import { NumericTransformer } from '../../common/transformers/numeric.transformer';

const numeric = new NumericTransformer();

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_products_category_id')
  @Column({ name: 'category_id', type: 'uuid' })
  categoryId: string;

  @ManyToOne(() => Category, (category) => category.products, { eager: false })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ unique: true, length: 20 })
  sku: string;

  @Index('idx_products_name')
  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'integer', nullable: true })
  weight: number | null;

  @Column({
    type: 'numeric',
    precision: 8,
    scale: 2,
    nullable: true,
    transformer: numeric,
  })
  width: number | null;

  @Column({
    type: 'numeric',
    precision: 8,
    scale: 2,
    nullable: true,
    transformer: numeric,
  })
  length: number | null;

  @Column({
    type: 'numeric',
    precision: 8,
    scale: 2,
    nullable: true,
    transformer: numeric,
  })
  height: number | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image: string | null;

  @Column({ type: 'integer', default: 0 })
  price: number;

  @Index('idx_products_is_active')
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'integer', default: 0 })
  stock: number;

  // @DeleteDateColumn drives TypeORM soft-delete: softDelete() sets this and
  // default queries auto-exclude rows where it is not null.
  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
