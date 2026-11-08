import { describe, expect, it } from 'vitest';
import { CARDS, pageCards, rollCards } from '@/lib/cat-cards';
import { emptyRewards, rewardSettingsSchema } from '@/lib/rewards';

describe('cat cards', () => {
  it('gives each of the five named cats ten unique images and one SSR prince', () => {
    for (const cat of ['球球', '仙草', '豆花', '粉圓', '奶油']) {
      const cards = CARDS.filter(c => c.cat === cat);
      expect(cards).toHaveLength(10);
      expect(cards.filter(c => c.rarity === 'SSR').map(c => c.name)).toEqual([`${cat}・小小王子`]);
    }
    expect(new Set(CARDS.map(c => c.art)).size).toBe(50);
  });
  it('has 50 numbered cards across 5 pages of 10', () => {
    expect(CARDS).toHaveLength(50);
    expect([1, 2, 3, 4, 5].map((p) => pageCards(p).length)).toEqual([10, 10, 10, 10, 10]);
  });
  it('drops one card per capsule', () => {
    expect(rollCards(5)).toHaveLength(5);
    expect(rollCards(1, () => 0)).toEqual([1]);
  });
  it('SSR is rarer than N', () => {
    const n = rollCards(20000).map((no) => CARDS[no - 1]!.rarity);
    expect(n.filter((r) => r === 'SSR').length).toBeLessThan(n.filter((r) => r === 'N').length / 5);
  });
  it('album reward defaults to disabled for old settings', () => {
    const { album: _, ...old } = emptyRewards;
    expect(rewardSettingsSchema.parse(old).album.enabled).toBe(false);
  });
});
