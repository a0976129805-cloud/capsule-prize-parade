import { Plane, Package } from 'lucide-react';
import { dispatchSummary, fulfillmentLabel, type Fulfillment } from '@/lib/fulfillment';

export function FulfillmentBadge({ item }: { item: Fulfillment }) {
  const preorder = item.fulfillmentType === 'preorder';
  const Icon = preorder ? Plane : Package;
  return <span className={`mt-1 inline-flex max-w-full items-start gap-1 rounded-md px-1.5 py-1 text-[10px] font-bold leading-relaxed ${preorder ? 'bg-primary/10 text-primary' : 'bg-secondary text-secondary-foreground'}`}><Icon className="mt-0.5 h-3 w-3 shrink-0" /><span className="min-w-0 whitespace-normal break-words">{fulfillmentLabel(item)}</span></span>;
}

export function DispatchNotice({ items, ordered = false }: { items: readonly Fulfillment[]; ordered?: boolean }) {
  const summary = dispatchSummary(items);
  return <section aria-label="整單出貨時間" className="border-y border-border py-3 text-xs leading-relaxed">
    <p className="flex items-center gap-1.5 font-bold text-primary">{summary.hasPreorder ? <Plane className="h-4 w-4" /> : <Package className="h-4 w-4" />}{summary.hasPreorder ? `含預購・整單預計 ${summary.dispatchDate || '待店長確認'} 出貨` : '現貨訂單・由店長安排寄送'}</p>
    <p className="mt-1 text-muted-foreground">{summary.hasPreorder ? '現貨與預購不拆單，待最晚預購商品回台後統一寄出。預計日期為寄出時間，非門市到貨日；如有變動由店長聯繫。' : '實際寄出時間請向店長確認，寄出後仍需物流配送時間。'}</p>
    <p className="mt-1 text-muted-foreground">{ordered ? '訂單已成立，等待預購出貨不受 24 小時倉庫期限影響。' : '24 小時是完成整倉結帳的期限，不是寄出期限；成立訂單後可安心等待出貨。'}</p>
  </section>;
}