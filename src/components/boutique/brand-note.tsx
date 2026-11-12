import { Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';
import catLogo from '@/assets/cat-logo.png';
export function BrandNote({ igUrl }: { igUrl: string }) {
  return <section className="flex items-start gap-3 border-y border-border py-5">
    <img src={catLogo} alt="奶油貓" className="size-14 shrink-0 object-contain" loading="lazy" />
    <div className="min-w-0"><p className="text-[11px] text-secondary-foreground">日本から、小さな楽しみ</p><h2 className="mt-1 text-sm font-bold">日本街角的小驚喜，帶回你的日常。</h2><p className="mt-2 text-xs leading-relaxed text-muted-foreground">留學日本的店長，挑選當地正版扭蛋。從選款到包裝，由小店親自整理，再透過 7-11 賣貨便送到你身邊。</p>{igUrl && <Button asChild variant="outline" size="sm" className="mt-3"><a href={igUrl} target="_blank" rel="noopener noreferrer"><Instagram className="size-4" />追蹤店長的日本日常</a></Button>}</div>
  </section>;
}