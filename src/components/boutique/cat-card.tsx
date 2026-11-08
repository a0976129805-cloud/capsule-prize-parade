import { forwardRef } from 'react';
import { CARDS, PAGES, cardLabel } from '@/lib/cat-cards';
import c1 from '@/assets/cats/cat-01.jpg';
import c2 from '@/assets/cats/cat-02.jpg';
import c3 from '@/assets/cats/cat-03.jpg';
import c4 from '@/assets/cats/cat-04.jpg';
import c5 from '@/assets/cats/cat-05.jpg';
import c6 from '@/assets/cats/cat-06.jpg';
import c7 from '@/assets/cats/cat-07.jpg';
import c8 from '@/assets/cats/cat-08.jpg';
import c9 from '@/assets/cats/cat-09.jpg';
import c10 from '@/assets/cats/cat-10.jpg';
import catLogo from '@/assets/cat-logo.png';

export const CAT_ART = [c1, c2, c3, c4, c5, c6, c7, c8, c9, c10];
const PAGE_TINT = ['hue-rotate(0deg)', 'hue-rotate(-18deg) saturate(1.15)', 'sepia(.25) saturate(1.2)', 'saturate(.75) brightness(1.06)', 'sepia(.35) saturate(1.4) brightness(1.04)'];
const STARS = { N: '★', R: '★★', SR: '★★★', SSR: '★★★★' } as const;

/** One collectible card; `big` shows the full trading-card layout. */
export const CatCardView = forwardRef<HTMLDivElement, { no: number; big?: boolean; copies?: number; className?: string }>(function CatCardView({ no, big, copies, className = '' }, ref) {
  const card = CARDS[no - 1];
  return <div ref={ref} data-rarity={card.rarity} className={`cat-card ${className}`}>
    <div className="overflow-hidden rounded-lg bg-card">
      <div className={`flex items-center justify-between px-1.5 ${big ? 'py-1.5' : 'py-0.5'}`}>
        <span className={`font-bold text-foreground ${big ? 'text-sm' : 'text-[9px]'}`}>{cardLabel(no)}</span>
        <span className={`font-bold text-secondary-foreground ${big ? 'text-xs' : 'text-[8px]'}`}>{card.rarity} {STARS[card.rarity]}</span>
      </div>
      <img src={CAT_ART[card.art]} alt={card.name} loading="lazy" width={768} height={1024} style={{ filter: PAGE_TINT[card.page - 1] }} className="aspect-[3/4] w-full object-cover" />
      <div className={big ? 'px-3 pb-3 pt-2 text-center' : 'px-1 pb-1 pt-0.5 text-center'}>
        <p className={`truncate font-bold ${big ? 'text-base' : 'text-[9px]'}`}>{card.name}</p>
        {big && <><p className="text-xs text-muted-foreground">{card.jp}・{PAGES[card.page - 1].title}</p><p className="mt-2 border-t border-border pt-2 text-xs italic">「{card.motto}」</p><div className="mt-2 flex items-center justify-center gap-1 text-[10px] text-muted-foreground"><img src={catLogo} alt="" className="h-4 w-4" />奶油貓 ガチャ屋・限定收藏卡</div></>}
      </div>
    </div>
    {!!copies && copies > 1 && <span className="absolute right-1 top-6 rounded-full bg-primary px-1.5 text-[9px] font-bold text-primary-foreground">×{copies}</span>}
  </div>;
});
