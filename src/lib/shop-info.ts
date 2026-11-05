export type ShopInfo = { lineUrl: string; igUrl: string; marquee: string; serviceHours: string; contactEmail: string };

export const DEFAULT_MARQUEE =
  "注意事項：因隨機商品的性質，有可能會連續抽中相同商品，敬請見諒。原則上，基於扭蛋商品的性質，恕不接受因顧客個人因素之退貨、換貨或取消。";

export const emptyShopInfo: ShopInfo = { lineUrl: "", igUrl: "", marquee: DEFAULT_MARQUEE, serviceHours: "", contactEmail: "" };

/** Groups order items by name → [{ name, qty }] keeping first-seen order. */
export function groupItems(items: { name: string }[]) {
  const m = new Map<string, number>();
  for (const i of items) m.set(i.name, (m.get(i.name) ?? 0) + 1);
  return [...m].map(([name, qty]) => ({ name, qty }));
}
