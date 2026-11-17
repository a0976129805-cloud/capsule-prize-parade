import { describe, expect, it } from 'vitest';
import { cleanTrackingNumber, validateShipment } from '@/lib/order-shipping';

describe('manual 7-11 shipment records', () => {
  it('normalizes a tracking number without changing its contents', () => {
    expect(cleanTrackingNumber('  abcd-1234  ')).toBe('ABCD-1234');
  });

  it('requires a tracking number before an order can be marked shipped', () => {
    expect(() => validateShipment('已出貨', '')).toThrow('請先填寫物流編號');
    expect(validateShipment('已出貨', 'ABCD1234')).toBe('ABCD1234');
  });

  it('allows a pending order without a tracking number', () => {
    expect(validateShipment('待出貨', '')).toBe('');
  });

  it('rejects invalid statuses and malformed tracking numbers', () => {
    expect(() => validateShipment('配送中', 'ABCD1234')).toThrow('訂單狀態不正確');
    expect(() => validateShipment('待出貨', '含有空格 1234')).toThrow('4–40 碼');
  });
});
