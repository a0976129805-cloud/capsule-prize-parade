// Business rules for vault storage and 7-11 cash-on-delivery shipping.
export const FREE_SHIP_COUNT = 10;
export const SHIP_FEE = 38;
export const VAULT_DAYS = 5;
const DAY = 86_400_000;

export function shippingFee(count: number) {
  return count >= FREE_SHIP_COUNT ? 0 : SHIP_FEE;
}

export function orderTotal(prices: number[]) {
  const sub = prices.reduce((a, p) => a + (Number(p) || 0), 0);
  const fee = shippingFee(prices.length);
  return { subtotal: sub, fee, total: sub + fee };
}

export function expiresAt(drawnAt: string | Date) {
  return new Date(new Date(drawnAt).getTime() + VAULT_DAYS * DAY);
}

export function isExpired(drawnAt: string | Date, now = new Date()) {
  return expiresAt(drawnAt).getTime() <= now.getTime();
}

/** Whole days left before the oldest item expires (0 = expires today). */
export function daysLeft(drawnAt: string | Date, now = new Date()) {
  return Math.max(0, Math.ceil((expiresAt(drawnAt).getTime() - now.getTime()) / DAY));
}
