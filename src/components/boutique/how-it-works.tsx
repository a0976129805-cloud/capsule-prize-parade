import { Sparkles, Package, Store } from 'lucide-react';
import { FREE_SHIP_AMOUNT, SHIP_FEE, VAULT_HOURS } from '@/lib/shipping';

/** Compact three-step purchase guide; values come from shared shipping constants. */
export function HowItWorks() {
  const steps = [
    { icon: Sparkles, title: '線上轉蛋', text: '當場開殼看款式' },
    { icon: Package, title: `倉庫保留 ${VAULT_HOURS}h`, text: '繼續轉、合成一單' },
    { icon: Store, title: '7-11 取貨付款', text: `滿 NT$${FREE_SHIP_AMOUNT.toLocaleString()} 免運・未滿 NT$${SHIP_FEE}` },
  ];
  return <section aria-labelledby="how-it-works" className="rounded-lg bg-muted/60 px-3 py-3">
    <h2 id="how-it-works" className="text-xs font-bold text-secondary-foreground">あそびかた・三步驟寄到 7-11</h2>
    <ol className="mt-2 grid grid-cols-3 gap-2">
      {steps.map(({ icon: Icon, title, text }, i) => <li key={title} className="flex min-w-0 flex-col items-center text-center">
        <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-card text-primary"><Icon className="h-4 w-4" /><span className="absolute -left-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">{i + 1}</span></span>
        <p className="mt-1 text-[11px] font-bold leading-tight">{title}</p>
        <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">{text}</p>
      </li>)}
    </ol>
  </section>;
}
