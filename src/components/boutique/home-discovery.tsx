import { useState } from 'react';
import { ChevronDown, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MachineSearch } from './machine-search';
import { PromoRedeemForm } from './promo-redeem';

export function HomeDiscovery({
  query,
  onQueryChange,
  onSearch,
}: {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: (query: string) => void;
}) {
  const [promoOpen, setPromoOpen] = useState(false);
  return (
    <section aria-label="搜尋扭蛋與兌換優惠" className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="space-y-3 p-4">
        <div>
          <p className="text-[10px] font-bold tracking-widest text-secondary-foreground">お気に入りをさがす</p>
          <h2 className="mt-0.5 text-base font-bold">今天想轉哪一款？</h2>
        </div>
        <MachineSearch id="home-machine-search" value={query} onChange={onQueryChange} onSubmit={onSearch} />
      </div>
      <div className="border-t border-dashed border-border px-4 py-2">
        <Button
          variant="bare"
          size="bare"
          aria-expanded={promoOpen}
          aria-controls="home-promo-entry"
          onClick={() => setPromoOpen((open) => !open)}
          className="flex min-h-10 w-full items-center gap-2 whitespace-normal py-1 text-left"
        >
          <Ticket className="h-5 w-5 shrink-0 text-primary" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold">我有優惠暗號</span>
            <span className="block text-[11px] font-normal text-muted-foreground">輸入店長給你的代碼，領券後直接去逛</span>
          </span>
          <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${promoOpen ? 'rotate-180' : ''}`} />
        </Button>
        {promoOpen && <div id="home-promo-entry" className="border-t border-border pt-3"><PromoRedeemForm autoFocus /></div>}
      </div>
    </section>
  );
}
