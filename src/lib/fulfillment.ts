export type Fulfillment = { fulfillmentType?: 'stock' | 'preorder'; dispatchDate?: string | null };

export function validDispatchDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}

export function dispatchSummary(items: readonly Fulfillment[]) {
  const preorders = items.filter(i => i.fulfillmentType === 'preorder');
  const dates = preorders.map(i => i.dispatchDate ?? '').filter(validDispatchDate).sort();
  return { hasPreorder: preorders.length > 0, dispatchDate: dates.at(-1) ?? null };
}

export function formatDispatchDate(value: string | null | undefined, withYear = false) {
  if (!value || !validDispatchDate(value)) return '待店長確認';
  const [year, month, day] = value.split('-').map(Number);
  return withYear ? `${year}年${month}月${day}日` : `${month}月${day}日`;
}

export function fulfillmentLabel(item: Fulfillment) {
  if (item.fulfillmentType !== 'preorder') return '台灣現貨・店長安排寄送';
  const date = formatDispatchDate(item.dispatchDate);
  return date === '待店長確認' ? '日本預購・出貨日待店長確認' : `日本預購・預計 ${date} 出貨`;
}

export function preorderConfirmed(summary: ReturnType<typeof dispatchSummary>, agreed: boolean) {
  return !summary.hasPreorder || (!!summary.dispatchDate && agreed);
}