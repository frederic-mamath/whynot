import { Kysely, Generated, Selectable } from "kysely";

export interface Database {
  users: UsersTable;
  seller_onboarding_data: SellerOnboardingDataTable;
  lives: LivesTable;
  live_participants: LiveParticipantsTable;
  live_products: LiveProductsTable;
  messages: MessagesTable;
  shops: ShopsTable;
  user_shop_roles: UserShopRolesTable;
  products: ProductsTable;
  vendor_promoted_products: VendorPromotedProductsTable;
  roles: RolesTable;
  user_roles: UserRolesTable;
  auctions: AuctionsTable;
  bids: BidsTable;
  orders: OrdersTable;
  payout_requests: PayoutRequestsTable;
  user_addresses: UserAddressesTable;
  product_images: ProductImagesTable;
  auth_providers: AuthProvidersTable;
  password_reset_tokens: PasswordResetTokensTable;
  categories: CategoriesTable;
  conditions: ConditionsTable;
}

export interface UsersTable {
  id: Generated<number>;
  email: string;
  password: string | null;
  nickname: string;
  firstname: string | null;
  lastname: string | null;
  first_name: string | null;
  last_name: string | null;
  is_verified: boolean;
  accepted_cgu_at: Date | null;
  stripe_account_id: string | null;
  stripe_onboarding_complete: boolean;
  stripe_customer_id: string | null;
  avatar_url: string | null;
  avatar_public_id: string | null;
  has_completed_onboarding: Generated<boolean>;
  seller_onboarding_step: Generated<number>;
  accepted_seller_rules_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface LivesTable {
  id: Generated<number>;
  name: string;
  host_id: number;
  max_participants: number | null;
  is_private: boolean | null;
  starts_at: Date;
  ends_at: Date | null;
  session_stopped_at: Date | null;
  description: string | null;
  cover_url: string | null;
  created_at: Date;
  ended_at: Date | null;
  highlighted_product_id: number | null;
  highlighted_at: Date | null;
}

// Backward compat alias
export type ChannelsTable = LivesTable;

export interface LiveParticipantsTable {
  id: Generated<number>;
  live_id: number;
  user_id: number;
  joined_at: Date;
  left_at: Date | null;
  role: string;
}

// Backward compat alias
export type ChannelParticipantsTable = LiveParticipantsTable;

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
  starting_price: string | null;
  wished_price: string | null;
  category_id: number | null;
  condition_id: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface LiveProductsTable {
  id: Generated<number>;
  live_id: number;
  product_id: number;
  created_at: Date;
}

// Backward compat alias
export type ChannelProductsTable = LiveProductsTable;

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
export type Live = Selectable<LivesTable>;
export type LiveParticipant = Selectable<LiveParticipantsTable>;
export type LiveProduct = Selectable<LiveProductsTable>;
// Backward compat aliases
export type Channel = Live;
export type ChannelParticipant = LiveParticipant;
export type ChannelProduct = LiveProduct;
export type Message = Selectable<MessagesTable>;
export type UserShopRole = Selectable<UserShopRolesTable>;
export type VendorPromotedProduct = Selectable<VendorPromotedProductsTable>;
export type Role = Selectable<RolesTable>;
export type UserRole = Selectable<UserRolesTable>;
export type Auction = Selectable<AuctionsTable>;
export type Bid = Selectable<BidsTable>;
export type Order = Selectable<OrdersTable>;
export type PayoutRequest = Selectable<PayoutRequestsTable>;
export type UserAddress = Selectable<UserAddressesTable>;
export type ProductImage = Selectable<ProductImagesTable>;

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

export interface ProductImagesTable {
  id: Generated<number>;
  product_id: number;
  url: string;
  cloudinary_public_id: string | null;
  position: number;
  created_at: Generated<Date>;
}

export interface AuthProvidersTable {
  id: Generated<number>;
  user_id: number;
  provider: string;
  provider_user_id: string;
  provider_email: string | null;
  created_at: Generated<Date>;
}

export type AuthProvider = Selectable<AuthProvidersTable>;

export interface PasswordResetTokensTable {
  id: Generated<number>;
  user_id: number;
  token_hash: string;
  expires_at: Date;
  used_at: Date | null;
  created_at: Generated<Date>;
}

export type PasswordResetToken = Selectable<PasswordResetTokensTable>;

export interface CategoriesTable {
  id: Generated<number>;
  name: string;
  emoji: string | null;
  position: number;
  created_at: Date;
}

export interface ConditionsTable {
  id: Generated<number>;
  name: string;
  position: number;
  created_at: Date;
}

export type Category = Selectable<CategoriesTable>;
export type Condition = Selectable<ConditionsTable>;

export interface SellerOnboardingDataTable {
  id: Generated<number>;
  user_id: number;
  category: string | null;
  sub_category: string | null;
  seller_type: string | null;
  selling_channels: string[] | null;
  monthly_revenue_range: string | null;
  item_count_range: string | null;
  team_size_range: string | null;
  live_hours_range: string | null;
  return_street: string | null;
  return_city: string | null;
  return_zip_code: string | null;
  return_country: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type SellerOnboardingData = Selectable<SellerOnboardingDataTable>;
