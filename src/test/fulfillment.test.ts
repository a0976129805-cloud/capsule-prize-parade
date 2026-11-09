import { describe, it, expect } from 'vitest';
import { dispatchSummary, validDispatchDate, preorderConfirmed } from '@/lib/fulfillment';
import { groupVaultItems } from '@/lib/vault-groups';

describe('preorder dispatch', () => {
  it('uses latest preorder date for an entire mixed vault', () => {
    expect(dispatchSummary([{ fulfillmentType: 'stock' }, { fulfillmentType: 'preorder', dispatchDate: '2026-11-25' }, { fulfillmentType: 'preorder', dispatchDate: '2026-12-03' }])).toEqual({ hasPreorder: true, dispatchDate: '2026-12-03' });
  });
  it('does not invent dates for stock or legacy reservations', () => {
    expect(dispatchSummary([{}, { fulfillmentType: 'stock' }])).toEqual({ hasPreorder: false, dispatchDate: null });
  });
  it('requires consent for a known preorder schedule', () => {
    const summary = dispatchSummary([{ fulfillmentType: 'preorder', dispatchDate: '2026-11-25' }]);
    expect(preorderConfirmed(summary, false)).toBe(false);
    expect(preorderConfirmed(summary, true)).toBe(true);
    expect(preorderConfirmed(dispatchSummary([{ fulfillmentType: 'preorder' }]), true)).toBe(false);
  });
  it('rejects nonexistent calendar dates', () => {
    expect(validDispatchDate('2026-02-30')).toBe(false);
    expect(validDispatchDate('2026-11-25')).toBe(true);
  });
  it('keeps matching prizes with different dispatch snapshots separate', () => {
    const item = { vaultId: '1', id: 'cat', name: 'cat', image: '', machineTitle: '', price: 100, drawnAt: '' };
    expect(groupVaultItems([item, { ...item, vaultId: '2', fulfillmentType: 'preorder', dispatchDate: '2026-11-25' }])).toHaveLength(2);
  });
});