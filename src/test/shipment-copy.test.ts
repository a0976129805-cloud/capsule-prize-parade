import { describe, expect, it } from 'vitest';
import { shipmentCopyText } from '@/lib/order-shipping';

describe('shipment copy', () => {
  it('lists recipient, phone, 7-11 store with code, and collected amount', () => {
    const text = shipmentCopyText({ id: 'ORD-1', total: 450, shipping: { name: '王小明', phone: '0912345678', storeName: '欣漢門市', storeCode: '123456' } });
    expect(text).toBe('收件人：王小明\n電話：0912345678\n門市：欣漢門市（123456）\n代收金額：NT$450\n訂單編號：ORD-1');
  });
});
