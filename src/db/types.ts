import { Kysely, Generated } from 'kysely';

export interface Database {
  users: UsersTable;
  channels: ChannelsTable;
  channel_participants: ChannelParticipantsTable;
  shops: ShopsTable;
  user_shop_roles: UserShopRolesTable;
  products: ProductsTable;
  channel_products: ChannelProductsTable;
  vendor_promoted_products: VendorPromotedProductsTable;
}

export interface UsersTable {
  id: Generated<number>;
  email: string;
  password: string;
  firstname: string | null;
  lastname: string | null;
  is_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ChannelsTable {
  id: Generated<number>;
  name: string;
  host_id: number;
  status: string;
  max_participants: number | null;
  is_private: boolean | null;
  created_at: Date;
  ended_at: Date | null;
}

export interface ChannelParticipantsTable {
  id: Generated<number>;
  channel_id: number;
  user_id: number;
  joined_at: Date;
  left_at: Date | null;
  role: string;
}

export interface ShopsTable {
  id: Generated<number>;
  name: string;
  description: string | null;
  owner_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface UserShopRolesTable {
  id: Generated<number>;
  user_id: number;
  shop_id: number;
  role: 'shop-owner' | 'vendor';
  created_at: Date;
}

export interface ProductsTable {
  id: Generated<number>;
  shop_id: number;
  name: string;
  description: string | null;
  price: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ChannelProductsTable {
  id: Generated<number>;
  channel_id: number;
  product_id: number;
  created_at: Date;
}

export interface VendorPromotedProductsTable {
  id: Generated<number>;
  channel_id: number;
  vendor_id: number;
  product_id: number;
  promoted_at: Date;
  unpromoted_at: Date | null;
}

