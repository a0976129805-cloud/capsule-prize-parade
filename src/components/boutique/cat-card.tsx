import { forwardRef } from 'react';
import { CARDS, PAGES, cardLabel } from '@/lib/cat-cards';
import catLogo from '@/assets/cat-logo.png';

const images = import.meta.glob<string>('/src/assets/cats/collection-*.jpg', { eager: true, query: '?url', import: 'default' });
export const CAT_ART = Object.entries(images).sort(([a], [b]) => a.localeCompare(b)).map(([, url]) => url);
const STARS = { N: '★', R: '★★', SR: '★★★', SSR: '★★★★' } as const;

/** One collectible card; `big` shows the full trading-card layout. */
export const CatCardView = forwardRef<HTMLDivElement, { no: number; big?: boolean; copies?: number | undefined; className?: string }>(function CatCardView({ no, big, copies, className = '' }, ref) {
  const card = CARDS[no - 1];
  if (!card) return null;
  return <div ref={ref} data-rarity={card.rarity} data-big={big ? "true" : "false"} className={`cat-card ${className}`}>
    <div className="overflow-hidden rounded-lg bg-card">
      <div className={`flex items-center justify-between px-1.5 ${big ? 'py-1.5' : 'py-0.5'}`}>
        <span className={`font-bold text-foreground ${big ? 'text-sm' : 'text-[9px]'}`}>{cardLabel(no)}</span>
        <span className={`font-bold text-secondary-foreground ${big ? 'text-xs' : 'text-[8px]'}`}>{card.rarity} {STARS[card.rarity]}</span>
      </div>
      <img src={CAT_ART[card.art]} alt={card.name} loading={big ? "eager" : "lazy"} width={384} height={512} className="aspect-[3/4] w-full object-cover" />
      <div className={big ? 'px-3 pb-3 pt-2 text-center' : 'px-1 pb-1 pt-0.5 text-center'}>
        <p className={`truncate font-bold ${big ? 'text-base' : 'text-[9px]'}`}>{card.name}</p>
        {big && <><p className="text-xs text-muted-foreground">{card.jp}・{PAGES[card.page - 1]!.title}</p><p className="mt-2 border-t border-border pt-2 text-xs italic">「{card.motto}」</p><div className="mt-2 flex items-center justify-center gap-1 text-[10px] text-muted-foreground"><img src={catLogo} alt="" className="h-4 w-4" />奶油貓 ガチャ屋・限定收藏卡</div></>}
      </div>
    </div>
    {!!copies && copies > 1 && <span className="absolute right-1 top-6 rounded-full bg-primary px-1.5 text-[9px] font-bold text-primary-foreground">×{copies}</span>}
  </div>;
});
