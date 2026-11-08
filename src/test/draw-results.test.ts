import { describe, expect, it } from 'vitest';
import { repeatDrawCount } from '@/lib/draw-results';
import type { VaultItem } from '@/lib/gacha.functions';
const item = (isLastOne = false): VaultItem => ({ vaultId: 'v', id: 'p', name: 'test', image: '', machineTitle: 'test', drawnAt: '', price: isLastOne ? 0 : 120, isLastOne });
describe('repeat draws exclude the free last-one award', () => {
  it('repeats five draws after five capsules plus one last-one gift', () => {
    expect(repeatDrawCount([...Array.from({ length: 5 }, () => item()), item(true)])).toBe(5);
  });
  it('repeats one draw after one capsule plus one last-one gift', () => {
    expect(repeatDrawCount([item(), item(true)])).toBe(1);
  });
});