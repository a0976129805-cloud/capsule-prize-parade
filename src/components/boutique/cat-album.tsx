import { useRef, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Download, Share2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogPortal, DialogOverlay, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { CARD_COUNT, PAGES, cardLabel, pageCards, CARDS } from '@/lib/cat-cards';
import { myAlbum, claimAlbumPage } from '@/lib/album.functions';
import { useMember } from './member-session';
import { CatCardView } from './cat-card';

export const albumQueryKey = (device: string) => ['album', device];

export function useAlbum(deviceId: string | null) {
  const get = useServerFn(myAlbum);
  return useQuery({ queryKey: albumQueryKey(deviceId ?? ''), queryFn: () => get({ data: { deviceId: deviceId! } }), enabled: !!deviceId });
}

export function CardViewer({ no, onClose, flash }: { no: number; onClose: () => void; flash: (m: string) => void }) {
  const ref = useRef<HTMLDivElement>(null); const [busy, setBusy] = useState(false);
  const save = async (share: boolean) => {
    if (!ref.current || busy) return; setBusy(true);
    try {
      const { toBlob } = await import('html-to-image');
      const blob = await toBlob(ref.current, { pixelRatio: 3, cacheBust: true });
      if (!blob) throw new Error('empty');
      const file = new File([blob], `奶油貓卡-${cardLabel(no)}.png`, { type: 'image/png' });
      if (share && navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: '我抽到奶油貓收藏卡！', text: `我在奶油貓ガチャ屋抽到 ${cardLabel(no)} ${CARDS[no - 1]!.name}！` });
      else { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = file.name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 10000); flash(share ? '此瀏覽器不支援直接分享，已下載卡片' : '卡片已存到下載'); }
    } catch (e) { if (!(e instanceof Error && e.name === 'AbortError')) flash('卡片製作失敗，請再試一次'); } finally { setBusy(false); }
  };
  return <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}><DialogPortal><DialogOverlay className="bg-overlay z-[70]" />
    <DialogPrimitive.Content aria-label="收藏卡大圖" className="fixed left-1/2 top-1/2 z-[70] w-[min(20rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2">
      <DialogTitle className="sr-only">{cardLabel(no)} {CARDS[no - 1]!.name}</DialogTitle>
      <Button variant="secondary" size="icon" aria-label="關閉卡片" onClick={onClose} className="absolute -right-2 -top-12 h-10 w-10 rounded-full"><X /></Button>
      <CatCardView ref={ref} no={no} big className="card-reveal" />
      <div className="mt-3 grid grid-cols-2 gap-2"><Button variant="secondary" disabled={busy} onClick={() => save(false)}><Download />存到手機</Button><Button disabled={busy} onClick={() => save(true)}><Share2 />{busy ? '製作中…' : '分享給好友'}</Button></div>
    </DialogPrimitive.Content></DialogPortal></Dialog>;
}

export function CatAlbum({ deviceId, onClose, flash, onLogin }: { deviceId: string; onClose: () => void; flash: (m: string) => void; onLogin: () => void }) {
  const album = useAlbum(deviceId); const member = useMember(); const claim = useServerFn(claimAlbumPage);
  const [page, setPage] = useState(1); const [view, setView] = useState<number | null>(null); const [busy, setBusy] = useState(false);
  const owned = new Map((album.data?.cards ?? []).map((c) => [c.no, c.copies]));
  const cards = pageCards(page); const have = cards.filter((c) => owned.has(c.no)).length;
  const claimed = album.data?.claimed.includes(page); const reward = album.data?.reward;
  const redeem = async () => {
    if (!member.userId) { onLogin(); return; }
    setBusy(true);
    try { const r = await claim({ data: { deviceId, page } }); flash(`🎉 已兌換第 ${page} 頁折價券：滿 NT$${r.minimum} 折 NT$${r.amount}`); await album.refetch(); }
    catch (e) { flash(e instanceof Error ? e.message : '兌換失敗'); } finally { setBusy(false); }
  };
  return <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}><DialogPortal><DialogOverlay className="bg-overlay" />
    <DialogPrimitive.Content aria-label="奶油貓卡冊" className="fixed inset-x-0 bottom-0 top-6 z-50 mx-auto max-w-md overflow-y-auto rounded-t-2xl bg-background p-3 pb-8">
      <div className="mb-2 flex items-center justify-between"><div><DialogTitle className="text-lg font-bold">📖 奶油貓卡冊</DialogTitle><DialogDescription className="text-xs text-muted-foreground">每顆扭蛋附贈一張貓咪卡・已收集 {owned.size}/{CARD_COUNT}</DialogDescription></div><Button variant="secondary" size="icon" aria-label="關閉卡冊" onClick={onClose} className="h-10 w-10 rounded-full"><X /></Button></div>
      <div className="mb-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-all" style={{ width: `${owned.size / CARD_COUNT * 100}%` }} /></div>
      <div className="album-book">
        <div className="mb-2 flex items-center justify-between text-primary-foreground">
          <Button variant="ghost" size="icon" aria-label="上一頁" disabled={page === 1} onClick={() => setPage(page - 1)} className="text-primary-foreground"><ChevronLeft /></Button>
          <div className="text-center"><p className="text-sm font-bold">{PAGES[page - 1]!.title}</p><p className="text-[10px]">第 {page} 頁・{PAGES[page - 1]!.zh}・{have}/10</p></div>
          <Button variant="ghost" size="icon" aria-label="下一頁" disabled={page === PAGES.length} onClick={() => setPage(page + 1)} className="text-primary-foreground"><ChevronRight /></Button>
        </div>
        <div className="album-page grid grid-cols-5 gap-1.5 p-2">
          {album.isLoading ? <p className="col-span-5 py-10 text-center text-xs text-muted-foreground">翻開卡冊中…</p> : cards.map((c) => owned.has(c.no)
            ? <button key={c.no} type="button" aria-label={`查看 ${cardLabel(c.no)}`} onClick={() => setView(c.no)} className="text-left"><CatCardView no={c.no} copies={owned.get(c.no)} /></button>
            : <div key={c.no} className="cat-card-locked flex aspect-[3/4.6] flex-col items-center justify-center text-muted-foreground"><span className="text-lg">?</span><span className="text-[9px] font-bold">{cardLabel(c.no)}</span></div>)}
        </div>
        <div className="mt-2 flex justify-center gap-1.5">{PAGES.map((_, i) => <button key={i} type="button" aria-label={`第 ${i + 1} 頁`} onClick={() => setPage(i + 1)} className={`h-2 rounded-full transition-all ${page === i + 1 ? 'w-5 bg-accent' : 'w-2 bg-primary-foreground/50'}`} />)}</div>
      </div>
      <div className="mt-3 rounded-xl border border-border bg-card p-3 text-sm">
        {claimed ? <p className="text-center font-bold text-primary">✅ 本頁集滿禮已兌換</p>
          : reward?.enabled ? <><p className="font-bold">集滿本頁 10 張可兌換：滿 NT${reward.minimum} 折 NT${reward.amount}</p><Button className="mt-2 w-full rounded-full" disabled={have < 10 || busy} onClick={redeem}>{have < 10 ? `還差 ${10 - have} 張` : member.userId ? '兌換折價券' : '登入會員後兌換'}</Button></>
          : <p className="text-center text-xs text-muted-foreground">集滿一頁的兌換禮準備中，先收集起來吧！</p>}
        <p className="mt-2 text-[10px] text-muted-foreground">卡片跟著這支手機的瀏覽器保存；收藏卡為店內附贈的數位卡，不是實體商品。</p>
      </div>
      {view && <CardViewer no={view} onClose={() => setView(null)} flash={flash} />}
    </DialogPrimitive.Content></DialogPortal></Dialog>;
}
