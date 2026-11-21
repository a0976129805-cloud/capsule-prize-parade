import { Sparkles, Package, Store } from 'lucide-react';
import { FREE_SHIP_AMOUNT, SHIP_FEE, VAULT_HOURS } from '@/lib/shipping';

/** First-visit three-step purchase guide; values come from shared shipping constants. */
export function HowItWorks() {
  const steps = [
    { icon: Sparkles, jp: 'まわす', title: '線上轉蛋', text: '選機台投幣，當場開殼看款式。不想碰運氣可整套直購。' },
    { icon: Package, jp: 'ためる', title: `倉庫保留 ${VAULT_HOURS} 小時`, text: '抽到的扭蛋先放倉庫，可以繼續轉、合在同一單。' },
    { icon: Store, jp: 'うけとる', title: '7-11 取貨付款', text: `整倉一起寄賣貨便。滿 NT$${FREE_SHIP_AMOUNT.toLocaleString()} 免運，未滿運費 NT$${SHIP_FEE}。` },
  ];
  return <section aria-labelledby="how-it-works" className="rounded-lg border border-border bg-card p-4">
    <p className="text-[10px] font-bold tracking-widest text-secondary-foreground">あそびかた</p>
    <h2 id="how-it-works" className="mt-0.5 text-base font-bold">三步驟，扭蛋寄到你家附近的 7-11</h2>
    <ol className="mt-3 grid gap-3 sm:grid-cols-3">
      {steps.map(({ icon: Icon, jp, title, text }, i) => <li key={title} className="flex gap-3 sm:flex-col sm:gap-2">
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted text-primary"><Icon className="h-5 w-5" /><span className="absolute -left-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{i + 1}</span></div>
        <div className="min-w-0"><p className="text-[10px] text-secondary-foreground">{jp}</p><p className="text-sm font-bold">{title}</p><p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{text}</p></div>
      </li>)}
    </ol>
  </section>;
}
