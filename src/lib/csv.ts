import { groupItems } from "@/lib/shop-info";

type Row = { id: string; total: number; createdAt: string; status: string; shipping: { name: string; phone: string; storeName: string; storeCode: string }; items: { name: string }[] };

const cell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

export function ordersToCsv(orders: Row[]): string {
  const head = ["訂單編號", "收件人", "電話", "取貨門市", "門市店號", "總金額", "商品", "建立時間", "狀態"];
  const rows = orders.map((o) => [o.id, o.shipping.name, o.shipping.phone, o.shipping.storeName, o.shipping.storeCode, o.total, groupItems(o.items).map((g) => `${g.name} x${g.qty}`).join("、"), o.createdAt, o.status]);
  return "\uFEFF" + [head, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
}
