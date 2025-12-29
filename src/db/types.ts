import { Kysely, Generated, Selectable } from 'kysely';

export interface Database {
  users: UsersTable;
  channels: ChannelsTable;
  channel_participants: ChannelParticipantsTable;
  messages: MessagesTable;
  shops: ShopsTable;
  user_shop_roles: UserShopRolesTable;
  products: ProductsTable;
  channel_products: ChannelProductsTable;
  vendor_promoted_products: VendorPromotedProductsTable;
  roles: RolesTable;
  user_roles: UserRolesTable;
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

export interface MessagesTable {
  id: Generated<number>;
  channel_id: number;
  user_id: number;
  content: string;
  created_at: Date;
  deleted_at: Date | null;
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

export interface RolesTable {
  id: Generated<number>;
  name: string;
  created_at: Date;
}

export interface UserRolesTable {
  id: Generated<number>;
  user_id: number;
  role_id: number;
  activated_by: number | null;
  activated_at: Date | null;
  created_at: Generated<Date>;
}

export type User = Selectable<UsersTable>;
export type Shop = Selectable<ShopsTable>;
export type Product = Selectable<ProductsTable>;
export type Channel = Selectable<ChannelsTable>;
export type ChannelParticipant = Selectable<ChannelParticipantsTable>;
export type Message = Selectable<MessagesTable>;
export type UserShopRole = Selectable<UserShopRolesTable>;
export type ChannelProduct = Selectable<ChannelProductsTable>;
export type VendorPromotedProduct = Selectable<VendorPromotedProductsTable>;
export type Role = Selectable<RolesTable>;
export type UserRole = Selectable<UserRolesTable>;

