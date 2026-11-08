import type { VaultItem } from './gacha.functions';
export function repeatDrawCount(items: VaultItem[]): 1 | 5 {
  return items.filter((i) => !i.isLastOne).length === 5 ? 5 : 1;
}