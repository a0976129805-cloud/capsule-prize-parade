export type Fulfillment = { fulfillmentType?: 'stock' | 'preorder'; dispatchDate?: string | null };

export function validDispatchDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}

export function dispatchSummary(items: readonly Fulfillment[]) {
  const preorders = items.filter(i => i.fulfillmentType === 'preorder');
  const dates = preorders.map(i => i.dispatchDate ?? '').filter(validDispatchDate).sort();
  return { hasPreorder: preorders.length > 0, dispatchDate: dates.at(-1) ?? null };
}

export function fulfillmentLabel(item: Fulfillment) {
  return item.fulfillmentType === 'preorder' ? `日本預購・預計 ${item.dispatchDate || '待店長確認'} 出貨` : '台灣現貨';
}

export function preorderConfirmed(summary: ReturnType<typeof dispatchSummary>, agreed: boolean) {
  return !summary.hasPreorder || (!!summary.dispatchDate && agreed);
}