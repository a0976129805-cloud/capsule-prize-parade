import { describe, expect, it } from 'vitest';
import { CARDS, pageCards, rollCards } from '@/lib/cat-cards';
import { emptyRewards, rewardSettingsSchema } from '@/lib/rewards';

describe('cat cards', () => {
  it('has 50 numbered cards across 5 pages of 10', () => {
    expect(CARDS).toHaveLength(50);
    expect([1, 2, 3, 4, 5].map((p) => pageCards(p).length)).toEqual([10, 10, 10, 10, 10]);
  });
  it('drops one card per capsule', () => {
    expect(rollCards(5)).toHaveLength(5);
    expect(rollCards(1, () => 0)).toEqual([1]);
  });
  it('SSR is rarer than N', () => {
    const n = rollCards(20000).map((no) => CARDS[no - 1].rarity);
    expect(n.filter((r) => r === 'SSR').length).toBeLessThan(n.filter((r) => r === 'N').length / 5);
  });
  it('album reward defaults to disabled for old settings', () => {
    const { album: _, ...old } = emptyRewards;
    expect(rewardSettingsSchema.parse(old).album.enabled).toBe(false);
  });
});
