# Ticket 002 — Backend: eliminate `any` types in repositories and routers

## Acceptance Criteria

- As a developer, `UserRepository.updateProfile` should not use `updateData: any`
- As a developer, `AddressRepository.update` should not use `updateData: any`
- As a developer, `OrderRepository.findBySellerId` should not use `status as any`
- As a developer, `AuctionRepository.findByChannelId` should not use `status as any`
- As a developer, `shop.ts` router `update` mutation should not use `updateData: any`

## Technical Strategy

- Backend
  - Repository
    - `app/src/repositories/UserRepository.ts` *(modified)*
      - Import `Updateable` from `kysely`
      - Replace `updateData: any` with `Updateable<UsersTable>`
    - `app/src/repositories/AddressRepository.ts` *(modified)*
      - Import `Updateable` from `kysely` and `UserAddressesTable` from `../db/types`
      - Replace `updateData: any` with `Updateable<UserAddressesTable>`
    - `app/src/repositories/OrderRepository.ts` *(modified)*
      - Change `findBySellerId(sellerId, status?: string)` to use the proper enum type `"pending" | "paid" | "failed" | "refunded"`
      - Remove `status as any` cast
    - `app/src/repositories/AuctionRepository.ts` *(modified)*
      - Change `findByChannelId(channelId, status?: string)` to use `"active" | "completed" | "cancelled"`
      - Remove `status as any` cast
  - Router
    - `app/src/routers/shop.ts` *(modified)*
      - Replace `updateData: any` with `{ name?: string; description?: string }`
