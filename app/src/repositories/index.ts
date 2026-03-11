/**
 * Repository layer exports - Spring Data JPA style
 *
 * Each repository is a class with named query methods.
 * Methods use Kysely query builder (similar to JPQL/Criteria API)
 *
 * Example usage:
 * ```typescript
 * const user = await userRepository.findByEmail('user@example.com');
 * const newUser = await userRepository.save('email', 'password');
 * ```
 */

// Repository instances
export { userRepository } from "./UserRepository";
export { shopRepository } from "./ShopRepository";
export { userShopRoleRepository } from "./UserShopRoleRepository";
export { productRepository } from "./ProductRepository";
// Live repositories (new names)
export { liveRepository } from "./LiveRepository";
export { liveProductRepository } from "./LiveProductRepository";
export { liveParticipantRepository } from "./LiveParticipantRepository";
// Backward compat — channel* aliases point to live* implementations
export { liveRepository as channelRepository } from "./LiveRepository";
export { liveProductRepository as channelProductRepository } from "./LiveProductRepository";
export { liveParticipantRepository as channelParticipantRepository } from "./LiveParticipantRepository";
export { authProviderRepository } from "./AuthProviderRepository";
export { vendorPromotedProductRepository } from "./VendorPromotedProductRepository";
export { roleRepository } from "./RoleRepository";
export { userRoleRepository } from "./UserRoleRepository";
export { messageRepository } from "./MessageRepository";
export { productImageRepository } from "./ProductImageRepository";
export { passwordResetTokenRepository } from "./PasswordResetTokenRepository";
export { categoryRepository } from "./CategoryRepository";
export { conditionRepository } from "./ConditionRepository";

// Auction-related repositories
import { AuctionRepository } from "./AuctionRepository";
import { BidRepository } from "./BidRepository";
import { OrderRepository } from "./OrderRepository";

export const auctionRepository = new AuctionRepository();
export const bidRepository = new BidRepository();
export const orderRepository = new OrderRepository();
