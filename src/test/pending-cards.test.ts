import { describe, expect, it } from 'vitest';
import { pendingCardCounts } from '@/lib/pending-cards';
describe('pending collectible previews', () => {
  it('keeps duplicate unpaid cards as pending copies without changing owned progress', () => {
    const owned = new Map([[1, 2]]);
    expect(pendingCardCounts([10, 10, 20]).get(10)).toBe(2);
    expect(owned.size).toBe(1);
  });
  it('removes all preview counts when expired rows are absent', () => {
    expect(pendingCardCounts([]).size).toBe(0);
  });
});