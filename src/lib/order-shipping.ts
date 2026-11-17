export const ORDER_STATUSES = ['待出貨', '已出貨', '已取貨', '已取消'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export function cleanTrackingNumber(value: unknown) {
  return String(value ?? '').trim().toUpperCase();
}

export function validateShipment(status: string, trackingNumber: string) {
  if (!ORDER_STATUSES.includes(status as OrderStatus)) throw new Error('訂單狀態不正確');
  if (trackingNumber && !/^[A-Z0-9-]{4,40}$/.test(trackingNumber)) {
    throw new Error('物流編號請輸入 4–40 碼英數字或連字號');
  }
  if (status === '已出貨' && !trackingNumber) throw new Error('標為已出貨前，請先填寫物流編號');
  return trackingNumber;
}
