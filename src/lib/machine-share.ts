export type ShareableMachine = {
  id: string;
  title: string;
  price: number;
  items: unknown[];
  fulfillmentType?: 'stock' | 'preorder';
  dispatchDate?: string | null;
};

export function machineShareUrl(origin: string, machineId: string) {
  return `${origin.replace(/\/$/, '')}/machines?machine=${encodeURIComponent(machineId)}`;
}

export function machineShareText(machine: ShareableMachine, origin: string) {
  const fulfillment = machine.fulfillmentType === 'preorder'
    ? `日本預購${machine.dispatchDate ? `・預計 ${machine.dispatchDate} 回台後出貨` : ''}`
    : '台灣現貨';
  return [
    `【日本正版扭蛋】${machine.title}`,
    `全 ${machine.items.length} 種・每抽 NT$${machine.price}・${fulfillment}`,
    '保留原廠內袋與蛋紙，7-11 取貨付款，商品滿 NT$1,000 免運。',
    `機台直達：${machineShareUrl(origin, machine.id)}`,
  ].join('\n');
}

export async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch { /* Restricted in-app browsers use the selection fallback below. */ }
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();
  if (!copied) throw new Error('複製失敗');
}
