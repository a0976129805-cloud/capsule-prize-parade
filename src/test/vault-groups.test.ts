import { describe, expect, it } from 'vitest';
import { groupVaultItems } from '@/lib/vault-groups';
import type { VaultItem } from '@/lib/gacha.functions';

const item: VaultItem = { vaultId: 'v1', id: 'rabbit', name: '花小兔', image: '/rabbit.jpg', machineTitle: '吊飾', drawnAt: '', price: 100 };

describe('vault quantity grouping', () => {
  it('shows repeated capsules once with their quantity, keeping first-seen order', () => {
    const groups = groupVaultItems([item, { ...item, id: 'dog', name: '大耳狗' }, { ...item, vaultId: 'v3' }]);
    expect(groups.map(g => [g.item.name, g.quantity])).toEqual([['花小兔', 2], ['大耳狗', 1]]);
  });
  it('does not merge different prizes just because they share a name', () => {
    expect(groupVaultItems([item, { ...item, id: 'other' }])).toHaveLength(2);
  });
  it('keeps free last-one gifts separate from paid prizes', () => {
    expect(groupVaultItems([item, { ...item, isLastOne: true, price: 0 }])).toHaveLength(2);
  });
  it('preserves original reservations and full checkout amount', () => {
    const items = [item, { ...item, vaultId: 'v2' }];
    const groups = groupVaultItems(items);
    expect(items.map(i => i.vaultId)).toEqual(['v1', 'v2']);
    expect(groups.reduce((sum, g) => sum + g.item.price * g.quantity, 0)).toBe(200);
  });
});