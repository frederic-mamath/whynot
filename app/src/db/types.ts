import { Kysely, Generated, Selectable } from "kysely";

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
  auctions: AuctionsTable;
  bids: BidsTable;
  orders: OrdersTable;
  payout_requests: PayoutRequestsTable;
  user_addresses: UserAddressesTable;
}

export interface UsersTable {
  id: Generated<number>;
  email: string;
  password: string;
  firstname: string | null;
  lastname: string | null;
  first_name: string | null;
  last_name: string | null;
  is_verified: boolean;
  stripe_account_id: string | null;
  stripe_onboarding_complete: boolean;
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
  highlighted_product_id: number | null;
  highlighted_at: Date | null;
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
  created_at: Generated<Date>;
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
  role: "shop-owner" | "vendor";
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

export interface AuctionsTable {
  id: string;
  product_id: number;
  seller_id: number;
  channel_id: number;
  starting_price: string;
  buyout_price: string | null;
  current_bid: string;
  highest_bidder_id: number | null;
  duration_seconds: number;
  started_at: Date;
  ends_at: Date;
  extended_count: number;
  status: "active" | "ended" | "completed" | "paid" | "cancelled";
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface BidsTable {
  id: string;
  auction_id: string;
  bidder_id: number;
  amount: string;
  placed_at: Generated<Date>;
  created_at: Generated<Date>;
}

export interface OrdersTable {
  id: string;
  auction_id: string;
  buyer_id: number;
  seller_id: number;
  product_id: number;
  final_price: string;
  platform_fee: string;
  seller_payout: string;
  payment_status: "pending" | "paid" | "failed" | "refunded";
  payment_deadline: Date;
  stripe_payment_intent_id: string | null;
  paid_at: Date | null;
  shipped_at: Date | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
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
export type Auction = Selectable<AuctionsTable>;
export type Bid = Selectable<BidsTable>;
export type Order = Selectable<OrdersTable>;
export type PayoutRequest = Selectable<PayoutRequestsTable>;
export type UserAddress = Selectable<UserAddressesTable>;

export interface PayoutRequestsTable {
  id: Generated<string>;
  seller_id: number;
  order_id: string;
  amount: string;
  status: "pending" | "approved" | "paid" | "rejected";
  payment_method: string | null;
  payment_details: string | null;
  processed_at: Date | null;
  processed_by: number | null;
  rejection_reason: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface UserAddressesTable {
  id: Generated<number>;
  user_id: number;
  label: string;
  street: string;
  street2: string | null;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  is_default: boolean;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}
