import { describe, expect, it } from 'vitest';
import { canSubmitCheckout, PICKUP_DAYS } from '@/lib/checkout-consent';
describe('pickup commitment', () => {
  it('requires separate pickup and vault rule acknowledgements', () => {
    expect(canSubmitCheckout(true, false)).toBe(false);
    expect(canSubmitCheckout(false, true)).toBe(false);
    expect(canSubmitCheckout(false, false)).toBe(false);
    expect(canSubmitCheckout(true, true)).toBe(true);
  });
  it('requires pickup within seven days after arrival', () => { expect(PICKUP_DAYS).toBe(7); });
});