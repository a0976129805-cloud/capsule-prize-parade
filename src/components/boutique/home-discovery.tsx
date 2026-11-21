import { useState } from 'react';
import { ChevronDown, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MachineSearch } from './machine-search';
import { PromoRedeemForm } from './promo-redeem';

/** Slim homepage search that sits directly above the featured machines. */
export function HomeSearch({
  query,
  onQueryChange,
  onSearch,
}: {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: (query: string) => void;
}) {
  return (
    <section aria-label="搜尋扭蛋">
      <MachineSearch id="home-machine-search" value={query} onChange={onQueryChange} onSubmit={onSearch} />
    </section>
  );
}

/** Collapsed promo-code entry; stays below the products so it never pushes them down. */
export function PromoCodeEntry() {
  const [open, setOpen] = useState(false);
  return (
    <section aria-label="兌換優惠暗號" className="rounded-lg border border-border bg-card px-3 py-1.5">
      <Button
        variant="bare"
        size="bare"
        aria-expanded={open}
        aria-controls="home-promo-entry"
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-10 w-full items-center gap-2 whitespace-normal py-1 text-left"
      >
        <Ticket className="h-5 w-5 shrink-0 text-primary" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold">我有優惠暗號</span>
          <span className="block text-[11px] font-normal text-muted-foreground">輸入店長給你的代碼，領券後直接去逛</span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </Button>
      {open && <div id="home-promo-entry" className="border-t border-border pb-2 pt-3"><PromoRedeemForm autoFocus /></div>}
    </section>
  );
}
