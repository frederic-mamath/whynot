export interface ProductOutboundDto {
  id: number;
  shopId: number;
  name: string;
  description: string | null;
  price: number | null;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductWithShopOutboundDto extends ProductOutboundDto {
  shopName: string;
}

export interface ProductInboundDto {
  shopId: number;
  name: string;
  description?: string;
  price?: number;
  imageUrl?: string | null;
}

export interface ProductUpdateInboundDto {
  name?: string;
  description?: string;
  price?: number;
  imageUrl?: string | null;
  isActive?: boolean;
}
