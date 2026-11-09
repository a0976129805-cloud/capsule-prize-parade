import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Truck, X, ShoppingBag } from 'lucide-react';
import { trustArt } from './trust-art';
import { TrustInfoDialog, type TrustTopic } from './trust-info';
import shrine from '@/assets/omikuji-shrine.jpg';
import type { Machine } from '@/lib/gacha.functions';
import { FREE_SHIP_AMOUNT, SHIP_FEE } from '@/lib/shipping';
import boutique from '@/assets/gacha-boutique.jpg';
import { FulfillmentBadge } from './fulfillment';

export function BannerCarousel({ images, onSets, onGuide }: { images: string[]; onSets: () => void; onGuide: () => void }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const slides = [
    { tag: '日本の小さな楽しみ', title: '奶油貓 扭蛋屋', text: '把日本街角的小驚喜，帶回你的日常。', action: '認識奶油貓', click: onGuide },
    { tag: 'お買いものガイド', title: '7-11 賣貨便寄送', text: '本站挑選・店長整理寄出・到店取貨付款', action: '安心購物指南', click: onGuide },
    { tag: 'コンプリートセット', title: '喜歡，就整套收藏', text: '每款各一顆，不用擔心抽到重複。', action: '逛逛整套賣場', click: onSets },
    { tag: '送料無料', title: '全館滿千免運', text: '商品滿 NT$1,000 免運・未滿運費 NT$38', action: '查看寄送規則', click: onGuide },
  ];
  const count = images.length || slides.length;
  const current = index % count;
  const move = (n: number) => setIndex((i) => (i + n + count) % count);
  useEffect(() => {
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), 6500);
    return () => clearInterval(t);
  }, [count, paused]);
  const s = slides[current % slides.length];
  if (!s) return null;
  return <section aria-label="奶油貓精選輪播" aria-roledescription="輪播" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={() => setPaused(false)}>
    <div className="boutique-banner relative overflow-hidden" onTouchStart={(e) => { e.currentTarget.dataset['touch'] = String(e.touches[0]?.clientX || 0); }} onTouchEnd={(e) => { const delta = (e.changedTouches[0]?.clientX || 0) - Number(e.currentTarget.dataset['touch']); if (Math.abs(delta) > 40) move(delta < 0 ? 1 : -1); }}>
      <img src={images[current] || boutique} alt={images.length ? `店長精選 ${current + 1}` : '奶油貓與日本扭蛋機插畫'} width={1536} height={1024} className="absolute inset-0 h-full w-full object-cover" />
      {!images.length && <div className="relative z-10 flex h-full w-[57%] flex-col justify-center px-5 py-6 sm:px-7">
        <span className="mb-2 text-[10px] font-bold text-secondary-foreground">{s.tag}</span>
        <h1 className="text-xl font-bold leading-snug text-foreground">{s.title}</h1>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{s.text}</p>
        <Button variant="link" className="mt-3 h-auto justify-start whitespace-normal p-0 text-xs" onClick={s.click}>{s.action} <ChevronRight /></Button>
      </div>}
      <Button size="icon" variant="secondary" aria-label="上一張輪播" onClick={() => move(-1)} className="absolute bottom-2 left-2 h-7 w-7 rounded-full opacity-90"><ChevronLeft /></Button>
      <Button size="icon" variant="secondary" aria-label="下一張輪播" onClick={() => move(1)} className="absolute bottom-2 right-2 h-7 w-7 rounded-full opacity-90"><ChevronRight /></Button>
    </div>
    <div className="flex justify-center gap-2 py-3">{Array.from({ length: count }, (_, i) => <Button key={i} variant="bare" size="bare" aria-label={`輪播第 ${i + 1} 張`} aria-current={current === i ? 'true' : undefined} onClick={() => setIndex(i)} className={`h-2 rounded-full transition-all ${current === i ? 'w-5 bg-primary' : 'w-2 bg-border'}`} />)}</div>
  </section>;
}

export function ShippingProgress({ subtotal }: { subtotal: number }) {
  const left = Math.max(0, FREE_SHIP_AMOUNT - subtotal);
  return <section className="shipping-progress py-3" aria-label="免運進度">
    <div className="mb-2 flex items-center gap-2 text-sm font-bold"><Truck className="h-4 w-4 text-secondary-foreground" />{left ? <>還差 <span className="text-primary">NT${left.toLocaleString()}</span> 即享免運</> : <span className="text-secondary-foreground">已達滿千免運！</span>}</div>
    <progress className="boutique-progress h-2 w-full" max={FREE_SHIP_AMOUNT} value={Math.min(subtotal, FREE_SHIP_AMOUNT)} aria-label="商品金額免運進度" />
    <p className="mt-1 text-[11px] text-muted-foreground">商品 NT${subtotal.toLocaleString()}・滿 NT$1,000 免運，未滿 NT${SHIP_FEE}</p>
  </section>;
}

export function TrustStrip({ onDaily }: { onDaily?: () => void }) {
  const [topic, setTopic] = useState<TrustTopic | null>(null);
  const tiles: { key: string; label: string; img: string; click: () => void; hot?: boolean }[] = [
    { key: 'cod', label: '7-11 貨到付款', img: trustArt.cod, click: () => setTopic('cod') },
    { key: 'genuine', label: '日本正版扭蛋', img: trustArt.genuine, click: () => setTopic('genuine') },
    ...(onDaily ? [{ key: 'daily', label: '每日御神籤', img: shrine, click: onDaily, hot: true }] : []),
    { key: 'shipping', label: '全館滿千免運', img: trustArt.shipping, click: () => setTopic('shipping') },
  ];
  return <><div className={`grid ${onDaily ? 'grid-cols-4' : 'grid-cols-3'} gap-1.5 border-y border-border py-2`}>
    {tiles.map((t) => <Button key={t.key} variant="bare" size="bare" onClick={t.click} className={`flex min-w-0 flex-col items-center gap-0.5 rounded-lg px-0.5 py-1 text-[10px] font-bold active:scale-95 transition-transform text-foreground`}>
      <span className="relative"><img src={t.img} alt="" width={1024} height={768} loading="lazy" className={`aspect-square w-12 rounded-full object-cover ${t.hot ? 'omikuji-ring' : ''}`} />{t.hot && <span className="absolute -right-2 -top-1.5 rounded-full bg-primary px-1.5 py-px text-[9px] leading-tight text-primary-foreground shadow-sm">無料</span>}</span>
      <span className="truncate text-center leading-tight">{t.label}</span>
    </Button>)}
  </div><TrustInfoDialog topic={topic} onClose={() => setTopic(null)} /></>;
}

export function SetPopup({ machine, busy, onClose, onBuy }: { machine: Machine; busy: boolean; onClose: () => void; onBuy: () => void }) {
  const available = machine.items.length > 0 && machine.items.every((i) => i.stock > 0);
  const regular = machine.price * machine.items.length;
  return <div className="bg-overlay fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center"><section role="dialog" aria-modal="true" aria-label="全套直購" className="max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-2xl bg-card p-5">
    <div className="flex items-start justify-between"><div><p className="text-xs font-bold text-secondary-foreground">コンプリートセット</p><h2 className="mt-1 text-xl font-bold">全套直購</h2></div><Button variant="ghost" size="icon" aria-label="關閉全套直購" disabled={busy} onClick={onClose}><X /></Button></div>
    <p className="mt-3 font-bold">{machine.title}</p><p className="mt-1 text-xs text-muted-foreground">全 {machine.items.length} 款・每款各一顆・附日本原廠蛋紙</p>
    <FulfillmentBadge item={machine} />
    <div className="my-5 flex gap-3 overflow-x-auto pb-2">{machine.items.map((i) => <div key={i.id} className="w-28 shrink-0"><img src={i.image} alt={i.name} className="aspect-square w-full rounded-lg object-cover" /><p className="mt-2 text-xs">{i.name}</p><p className={`mt-1 text-[10px] ${i.stock > 0 ? 'text-secondary-foreground' : 'text-destructive'}`}>{i.stock > 0 ? '✓ 每款一顆' : '已售完'}</p></div>)}</div>
    <div className="flex items-baseline justify-between border-t border-border pt-3"><span className="text-sm">全套收藏價</span><span className="text-2xl font-bold text-primary">NT${machine.setPrice}</span></div>
    {regular > machine.setPrice && <p className="mt-1 text-right text-xs text-muted-foreground">單抽合計 NT${regular}・整套省 NT${regular - machine.setPrice}</p>}
    <ShippingProgress subtotal={machine.setPrice} />
    <p className="mb-3 text-xs leading-relaxed text-muted-foreground">確認後直接前往收件資料；若已有倉庫商品，會一併結帳寄出。請於 24 小時內完成出貨申請。</p>
    <Button className="h-12 w-full rounded-full" disabled={busy || !available} onClick={onBuy}><ShoppingBag />{busy ? '正在確認庫存…' : available ? '確認整套・填寫寄送資料' : '部分款式已售完'}</Button>
  </section></div>;
}
