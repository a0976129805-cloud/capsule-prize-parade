import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { recentDraws } from '@/lib/draw-feed.functions';
import { Sparkles } from 'lucide-react';

export function DrawFeed() {
  const get = useServerFn(recentDraws);
  const { data = [] } = useQuery({ queryKey: ['recent-draws'], queryFn: () => get(), refetchInterval: 30000 });
  if (!data.length) return null;
  return <section aria-label="最近真實開獎" className="border-y border-border py-3">
    <div className="mb-2 flex items-center gap-2 text-xs font-bold text-secondary-foreground"><Sparkles className="h-4 w-4" />店內開獎動態 <span className="ml-auto text-[10px] font-medium text-muted-foreground">最近 24 小時・匿名</span></div>
    <div className="max-h-24 space-y-2 overflow-y-auto">{data.map((d) => <p key={d.id} className="flex gap-2 text-xs"><span className="shrink-0 text-muted-foreground">{new Date(d.created_at).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Taipei' })}</span><span className="min-w-0 break-words">{d.is_last_one ? '🎊 最後賞！' : '🎉 抽出'} <b>{d.prize_name}</b><span className="block text-[10px] text-muted-foreground">{d.machine_title}</span></span></p>)}</div>
  </section>;
}