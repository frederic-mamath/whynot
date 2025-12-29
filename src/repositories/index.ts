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
export { userRepository } from './UserRepository';
export { shopRepository } from './ShopRepository';
export { userShopRoleRepository } from './UserShopRoleRepository';
export { productRepository } from './ProductRepository';
export { channelProductRepository } from './ChannelProductRepository';
export { channelRepository } from './ChannelRepository';
export { channelParticipantRepository } from './ChannelParticipantRepository';
export { vendorPromotedProductRepository } from './VendorPromotedProductRepository';
export { roleRepository } from './RoleRepository';
export { userRoleRepository } from './UserRoleRepository';
export { messageRepository } from './MessageRepository';
