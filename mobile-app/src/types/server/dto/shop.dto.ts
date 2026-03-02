export interface ShopOutboundDto {
  id: number;
  name: string;
  description: string | null;
  ownerId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShopInboundDto {
  name: string;
  description?: string;
}

export interface ShopWithRoleOutboundDto extends ShopOutboundDto {
  userRole: 'shop-owner' | 'vendor';
}
