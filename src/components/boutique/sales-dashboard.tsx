import { useState } from 'react';
import { RefreshCw, Package, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { salesSummary } from '@/lib/sales-summary';
import type { Machine, Order } from '@/lib/gacha.functions';
const money = (n: number) => `NT$${n.toLocaleString('zh-TW')}`;
export function SalesDashboard({ orders, machines, loading, error, refresh }: { orders: Order[]; machines: Machine[]; loading: boolean; error: boolean; refresh: () => void }) {
  const [scope,setScope] = useState('active');
  const s = salesSummary(orders,machines,scope);
  return <section className="space-y-4">
    <div className="flex items-center justify-between"><h2 className="flex items-center gap-2 text-lg font-bold"><TrendingUp className="size-5 text-primary" />銷量統計</h2><Button variant="outline" size="icon" aria-label="重新整理銷量" onClick={refresh} disabled={loading}><RefreshCw className={loading ? 'animate-spin size-4' : 'size-4'} /></Button></div>
    <div className="flex gap-2">{([['active','有效訂單'],['collected','已取貨']] as const).map(([k,t]) => <Button key={k} size="sm" variant={scope===k?'default':'outline'} aria-pressed={scope===k} onClick={()=>setScope(k)}>{t}</Button>)}</div>
    {loading ? <p role="status" className="py-6 text-center text-sm text-muted-foreground">讀取銷量中…</p> : error ? <p role="alert" className="text-sm text-destructive">訂單讀取失敗，請重新整理。</p> : <>
    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-y border-border py-4">{[['訂單數',`${s.orders} 筆`],['售出扭蛋',`${s.count} 顆`],['商品金額（折前）',money(s.gross)],['商品金額（折後）',money(s.net)]].map(([t,v])=><div key={t}><dt className="text-xs text-muted-foreground">{t}</dt><dd className="mt-1 text-xl font-bold tabular-nums">{v}</dd></div>)}</dl>
    <p className="text-xs leading-relaxed text-muted-foreground">不含取消單、運費與未結帳倉庫；最後賞另計 {s.gifts} 份，折扣合計 {money(s.discount)}。有效訂單不代表已收款，7-11 代收金額也不等於已撥款。舊訂單未記錄購買方式，無法可靠區分單抽與整套組數。</p>
    {s.rows.length===0 ? <div className="border-b border-border py-8 text-center text-muted-foreground"><Package className="mx-auto mb-2 size-6" /><p className="text-sm">目前沒有符合的銷售紀錄</p></div> : <div className="divide-y divide-border">{s.rows.map((r,i)=><article key={r.key} className="py-3"><div className="flex items-start gap-3"><span className="text-sm font-bold text-primary">{i+1}</span><div className="min-w-0 flex-1"><h3 className="break-words text-sm font-bold">{r.title}</h3><p className="mt-1 text-xs text-muted-foreground">{r.count} 顆・目前庫存 {r.stock===null?'已下架':`${r.stock} 顆`}</p></div><span className="shrink-0 text-sm font-bold tabular-nums">{money(r.amount)}</span></div><details className="ml-5 mt-2 text-xs"><summary className="cursor-pointer text-secondary-foreground">款式銷量</summary><ul className="mt-2 space-y-1">{r.prizes.map((p,j)=><li key={j} className="flex justify-between gap-3"><span>{p.name}</span><span className="shrink-0 tabular-nums">{p.count} 顆</span></li>)}</ul></details></article>)}</div>}
    </>}
  </section>;
}