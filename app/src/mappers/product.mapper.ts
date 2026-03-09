import { Product, ProductsTable } from "../db/types";
import {
  ProductOutboundDto,
  ProductInboundDto,
  ProductUpdateInboundDto,
  ProductWithShopOutboundDto,
} from "../types/dto/product.dto";

export function mapProductToProductOutboundDto(
  product: Product,
): ProductOutboundDto {
  return {
    id: product.id,
    shopId: product.shop_id,
    name: product.name,
    description: product.description,
    price: product.price ? parseFloat(product.price) : null,
    imageUrl: product.image_url,
    isActive: product.is_active,
    startingPrice: product.starting_price
      ? parseFloat(product.starting_price)
      : null,
    wishedPrice: product.wished_price ? parseFloat(product.wished_price) : null,
    categoryId: product.category_id,
    conditionId: product.condition_id,
    createdAt: product.created_at,
    updatedAt: product.updated_at,
  };
}

export function mapProductWithShopToProductWithShopOutboundDto(
  product: Product,
  shopName: string,
): ProductWithShopOutboundDto {
  return {
    ...mapProductToProductOutboundDto(product),
    shopName,
  };
}

export function mapCreateProductInboundDtoToProduct(
  dto: ProductInboundDto,
): Omit<ProductsTable, "id" | "is_active" | "created_at" | "updated_at"> {
  return {
    shop_id: dto.shopId,
    name: dto.name,
    description: dto.description ?? null,
    price: dto.price ? dto.price.toString() : null,
    image_url: dto.imageUrl ?? null,
    starting_price: dto.startingPrice ? dto.startingPrice.toString() : null,
    wished_price: dto.wishedPrice ? dto.wishedPrice.toString() : null,
    category_id: dto.categoryId ?? null,
    condition_id: dto.conditionId ?? null,
  };
}

export function mapUpdateProductInboundDtoToProduct(
  dto: ProductUpdateInboundDto,
): Partial<
  Pick<
    ProductsTable,
    | "name"
    | "description"
    | "price"
    | "image_url"
    | "is_active"
    | "starting_price"
    | "wished_price"
    | "category_id"
    | "condition_id"
  >
> {
  const update: Partial<
    Pick<
      ProductsTable,
      | "name"
      | "description"
      | "price"
      | "image_url"
      | "is_active"
      | "starting_price"
      | "wished_price"
      | "category_id"
      | "condition_id"
    >
  > = {};

  if (dto.name !== undefined) update.name = dto.name;
  if (dto.description !== undefined)
    update.description = dto.description ?? null;
  if (dto.price !== undefined)
    update.price = dto.price ? dto.price.toString() : null;
  if (dto.imageUrl !== undefined) update.image_url = dto.imageUrl;
  if (dto.isActive !== undefined) update.is_active = dto.isActive;
  if (dto.startingPrice !== undefined)
    update.starting_price = dto.startingPrice
      ? dto.startingPrice.toString()
      : null;
  if (dto.wishedPrice !== undefined)
    update.wished_price = dto.wishedPrice ? dto.wishedPrice.toString() : null;
  if (dto.categoryId !== undefined) update.category_id = dto.categoryId;
  if (dto.conditionId !== undefined) update.condition_id = dto.conditionId;

  return update;
}
