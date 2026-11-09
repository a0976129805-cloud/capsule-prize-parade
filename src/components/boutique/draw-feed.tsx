import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { recentDraws } from '@/lib/draw-feed.functions';
import { Sparkles } from 'lucide-react';
import type { Machine } from '@/lib/gacha.functions';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Pause, Play } from 'lucide-react';

export function DrawFeed({ machines = [] }: { machines?: Machine[] }) {
  const get = useServerFn(recentDraws);
  const { data = [] } = useQuery({ queryKey: ['recent-draws'], queryFn: () => get(), refetchInterval: 30000 });
  const track = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  useEffect(() => {
    if (paused || interacting || data.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => {
      const node = track.current;
      if (!node || document.hidden) return;
      const next = node.scrollLeft + 252;
      node.scrollTo({ left: next >= node.scrollWidth - node.clientWidth - 2 ? 0 : next, behavior: 'smooth' });
    }, 4500);
    return () => clearInterval(timer);
  }, [paused, interacting, data.length]);
  if (!data.length) return null;
  return <section aria-label="最近真實開獎" className="border-y border-border py-3">
    <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-bold text-secondary-foreground"><Sparkles className="h-4 w-4" />店內開獎動態 <span className="ml-auto text-[10px] font-medium text-muted-foreground">24 小時內真實紀錄</span>{data.length > 1 && <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={paused ? '播放開獎動態' : '暫停開獎動態'} title={paused ? '播放開獎動態' : '暫停開獎動態'} onClick={() => setPaused(!paused)}>{paused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}</Button>}</div>
    <div ref={track} onMouseEnter={() => setInteracting(true)} onMouseLeave={() => setInteracting(false)} onTouchStart={() => setPaused(true)} onFocusCapture={() => setInteracting(true)} onBlurCapture={() => setInteracting(false)} className="draw-feed-track flex gap-3 overflow-x-auto pb-2">{data.map((d) => {
      const machine = machines.find((m) => m.title === d.machine_title);
      const image = d.is_last_one ? machine?.lastOneImage : machine?.items.find((i) => i.name === d.prize_name)?.image;
      return <article key={d.id} className="flex w-60 shrink-0 items-center gap-3 rounded-lg border border-border bg-card p-3">
        {image ? <img src={image} alt={d.prize_name} loading="lazy" className="h-12 w-12 shrink-0 rounded-full border border-border object-contain" /> : <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground"><Sparkles className="h-5 w-5" /></span>}
        <div className="min-w-0"><p className="text-[10px] font-bold text-secondary-foreground">{d.is_last_one ? 'ラストワン · 最後賞' : 'ガチャ！· 抽出'} <time dateTime={d.created_at} className="font-medium text-muted-foreground">{new Date(d.created_at).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Taipei' })}</time></p><p className="mt-1 break-words text-xs font-bold">{d.prize_name}</p><p className="mt-1 truncate text-[10px] text-muted-foreground">{d.machine_title}</p></div>
      </article>;
    })}</div>
  </section>;
}