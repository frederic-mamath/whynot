import { ShopsTable, UserShopRolesTable } from '../db/types';
import { ShopOutboundDto, ShopInboundDto, ShopWithRoleOutboundDto } from '../types/dto/shop.dto';

export function mapShopToShopOutboundDto(shop: ShopsTable): ShopOutboundDto {
  return {
    id: shop.id,
    name: shop.name,
    description: shop.description,
    ownerId: shop.owner_id,
    createdAt: shop.created_at,
    updatedAt: shop.updated_at,
  };
}

export function mapShopWithRoleToShopWithRoleOutboundDto(
  shop: ShopsTable,
  role: 'shop-owner' | 'vendor'
): ShopWithRoleOutboundDto {
  return {
    ...mapShopToShopOutboundDto(shop),
    userRole: role,
  };
}

export function mapCreateShopInboundDtoToShop(
  dto: ShopInboundDto,
  ownerId: number
): Omit<ShopsTable, 'id' | 'created_at' | 'updated_at'> {
  return {
    name: dto.name,
    description: dto.description ?? null,
    owner_id: ownerId,
  };
}
