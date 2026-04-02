/** Platform fee rate (7%) */
const PLATFORM_FEE_RATE = 0.07;

export function calculatePlatformFee(finalPrice: number): number {
  return Math.round(finalPrice * PLATFORM_FEE_RATE * 100) / 100;
}

export function calculateSellerPayout(finalPrice: number): number {
  return Math.round(finalPrice * (1 - PLATFORM_FEE_RATE) * 100) / 100;
}
