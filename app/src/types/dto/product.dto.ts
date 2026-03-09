export interface ProductOutboundDto {
  id: number;
  shopId: number;
  name: string;
  description: string | null;
  price: number | null;
  imageUrl: string | null;
  isActive: boolean;
  startingPrice: number | null;
  wishedPrice: number | null;
  categoryId: number | null;
  conditionId: number | null;
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
  startingPrice?: number;
  wishedPrice?: number;
  categoryId?: number;
  conditionId?: number;
}

export interface ProductUpdateInboundDto {
  name?: string;
  description?: string;
  price?: number;
  imageUrl?: string | null;
  isActive?: boolean;
  startingPrice?: number;
  wishedPrice?: number;
  categoryId?: number | null;
  conditionId?: number | null;
}
