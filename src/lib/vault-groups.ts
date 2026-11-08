import type { VaultItem } from '@/lib/gacha.functions';

/** Presentation only: keep every original reservation for checkout and expiry. */
export function groupVaultItems(items: readonly VaultItem[]) {
  const groups = new Map<string, { key: string; item: VaultItem; quantity: number }>();
  for (const item of items) {
    const key = JSON.stringify([item.id, item.machineTitle, item.name, item.image, item.price, !!item.isLastOne]);
    const group = groups.get(key);
    if (group) group.quantity += 1;
    else groups.set(key, { key, item, quantity: 1 });
  }
  return [...groups.values()];
}