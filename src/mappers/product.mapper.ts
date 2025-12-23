import { ProductsTable } from '../db/types';
import { ProductOutboundDto, ProductInboundDto, ProductUpdateInboundDto, ProductWithShopOutboundDto } from '../types/dto/product.dto';

export function mapProductToProductOutboundDto(product: ProductsTable): ProductOutboundDto {
  return {
    id: product.id,
    shopId: product.shop_id,
    name: product.name,
    description: product.description,
    price: product.price ? parseFloat(product.price) : null,
    imageUrl: product.image_url,
    isActive: product.is_active,
    createdAt: product.created_at,
    updatedAt: product.updated_at,
  };
}

export function mapProductWithShopToProductWithShopOutboundDto(
  product: ProductsTable,
  shopName: string
): ProductWithShopOutboundDto {
  return {
    ...mapProductToProductOutboundDto(product),
    shopName,
  };
}

export function mapCreateProductInboundDtoToProduct(
  dto: ProductInboundDto
): Omit<ProductsTable, 'id' | 'is_active' | 'created_at' | 'updated_at'> {
  return {
    shop_id: dto.shopId,
    name: dto.name,
    description: dto.description ?? null,
    price: dto.price ? dto.price.toString() : null,
    image_url: dto.imageUrl ?? null,
  };
}

export function mapUpdateProductInboundDtoToProduct(
  dto: ProductUpdateInboundDto
): Partial<Pick<ProductsTable, 'name' | 'description' | 'price' | 'image_url' | 'is_active'>> {
  const update: Partial<Pick<ProductsTable, 'name' | 'description' | 'price' | 'image_url' | 'is_active'>> = {};
  
  if (dto.name !== undefined) update.name = dto.name;
  if (dto.description !== undefined) update.description = dto.description ?? null;
  if (dto.price !== undefined) update.price = dto.price ? dto.price.toString() : null;
  if (dto.imageUrl !== undefined) update.image_url = dto.imageUrl;
  if (dto.isActive !== undefined) update.is_active = dto.isActive;
  
  return update;
}
