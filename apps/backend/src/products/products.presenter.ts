import { Product } from './entities/product.entity';

// API-facing shape: flattens the joined category into categoryName and drops
// internal fields like deletedAt. Matches documentation/API-Contract.md.
export interface ProductResponse {
  id: string;
  categoryId: string;
  categoryName: string | null;
  sku: string;
  name: string;
  description: string | null;
  weight: number | null;
  width: number | null;
  length: number | null;
  height: number | null;
  image: string | null;
  price: number;
  isActive: boolean;
  stock: number;
  // Archived = soft-deleted. Surfaced so the UI can show status & restore.
  archived: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export function toProductResponse(product: Product): ProductResponse {
  const archived = product.deletedAt != null;
  return {
    id: product.id,
    categoryId: product.categoryId,
    categoryName: product.category?.name ?? null,
    sku: product.sku,
    name: product.name,
    description: product.description,
    weight: product.weight,
    width: product.width,
    length: product.length,
    height: product.height,
    image: product.image,
    price: product.price,
    // In this admin, a product's status is "active vs archived". Active means
    // not soft-deleted.
    isActive: !archived,
    stock: product.stock,
    archived,
    deletedAt: product.deletedAt,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}
