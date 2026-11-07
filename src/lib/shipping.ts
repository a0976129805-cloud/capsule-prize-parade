// Business rules for vault storage and 7-11 cash-on-delivery shipping.
export const FREE_SHIP_AMOUNT = 1000;
export const SHIP_FEE = 38;
export const VAULT_HOURS = 24;
export const VAULT_MS = VAULT_HOURS * 3_600_000;

export function shippingFee(subtotal: number) {
  return subtotal >= FREE_SHIP_AMOUNT ? 0 : SHIP_FEE;
}

export function orderTotal(prices: number[]) {
  const sub = prices.reduce((a, p) => a + (Number(p) || 0), 0);
  const fee = shippingFee(sub);
  return { subtotal: sub, fee, total: sub + fee };
}

export function expiresAt(drawnAt: string | Date) {
  return new Date(new Date(drawnAt).getTime() + VAULT_MS);
}

export function isExpired(drawnAt: string | Date, now = new Date()) {
  return expiresAt(drawnAt).getTime() <= now.getTime();
}

/** "HH:MM" left before the oldest item is released back to the machine. */
export function timeLeft(drawnAt: string | Date, now = new Date()) {
  const ms = Math.max(0, expiresAt(drawnAt).getTime() - now.getTime());
  const h = Math.floor(ms / 3_600_000), m = Math.floor((ms % 3_600_000) / 60_000);
  return `${h} 小時 ${String(m).padStart(2, "0")} 分`;
}
