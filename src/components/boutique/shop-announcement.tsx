import { useState } from 'react';
import { ChevronDown, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Owner news shown as a slim strip; long text expands on demand instead of taking over the page. */
export function ShopAnnouncement({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const body = text.trim();
  if (!body) return null;
  const long = body.length > 40 || body.includes('\n');
  return (
    <section aria-label="店長採購與出貨公告" className="rounded-lg border border-primary/20 bg-card px-3 py-2.5">
      <div className="flex gap-2.5">
        <Megaphone className="mt-0.5 h-4 w-4 shrink-0 text-secondary-foreground" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h2 className="text-[11px] font-bold text-secondary-foreground">店長近況・日本採購與出貨</h2>
          <p className={`mt-0.5 whitespace-pre-wrap break-words text-sm leading-relaxed ${open ? '' : 'line-clamp-1'}`}>{body}</p>
        </div>
        {long && <Button variant="bare" size="bare" aria-expanded={open} aria-label={open ? '收合公告' : '展開公告全文'} onClick={() => setOpen((v) => !v)} className="h-8 w-8 shrink-0 justify-center rounded-full text-muted-foreground hover:bg-muted">
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        </Button>}
      </div>
    </section>
  );
}
