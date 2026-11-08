import { describe, expect, it } from 'vitest';
import { moveMachine, validateMachineOrder } from '@/lib/machine-order';

describe('Owner machine ordering', () => {
  const ids = ['stock-low', 'popular', 'stock-high'];
  it('moves the chosen machine to the first position without removing others', () => {
    expect(moveMachine(ids, 'stock-high', 'top')).toEqual(['stock-high', 'stock-low', 'popular']);
    expect(ids).toEqual(['stock-low', 'popular', 'stock-high']);
  });
  it('moves a machine up one position', () => {
    expect(moveMachine(ids, 'popular', 'up')).toEqual(['popular', 'stock-low', 'stock-high']);
  });
  it('moves a machine down one position', () => {
    expect(moveMachine(ids, 'popular', 'down')).toEqual(['stock-low', 'stock-high', 'popular']);
  });
  it('does not wrap at the first or last position', () => {
    expect(moveMachine(ids, 'stock-low', 'up')).toEqual(ids);
    expect(moveMachine(ids, 'stock-high', 'down')).toEqual(ids);
  });
  it('rejects duplicate, missing or substituted machine IDs', () => {
    for (const invalid of [['popular', 'popular', 'stock-high'], ['popular'], ['stock-low', 'popular', 'unknown']]) {
      expect(() => validateMachineOrder({ ids: invalid, expected: ids })).toThrow();
    }
    expect(validateMachineOrder({ ids: [...ids].reverse(), expected: ids }).ids).toEqual([...ids].reverse());
  });
});