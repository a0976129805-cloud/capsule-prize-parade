import { Megaphone } from 'lucide-react';

export function ShopAnnouncement({ text }: { text: string }) {
  if (!text.trim()) return null;
  return (
    <section aria-label="店長採購與出貨公告" className="relative overflow-hidden rounded-2xl border border-primary/20 bg-card px-4 py-3 shadow-sm">
      <span aria-hidden="true" className="absolute -right-5 -top-6 h-20 w-20 rounded-full border-[14px] border-secondary/40" />
      <div className="relative flex gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
          <Megaphone className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-bold tracking-[0.18em] text-secondary-foreground">店長からのおたより</p>
          <h2 className="mt-0.5 text-sm font-bold">日本採購・出貨近況</h2>
          <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground">{text}</p>
        </div>
      </div>
    </section>
  );
}
