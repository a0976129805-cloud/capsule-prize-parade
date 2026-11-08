import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Share2, X } from 'lucide-react';
import type { VaultItem } from '@/lib/gacha.functions';
import catLogo from '@/assets/cat-logo.png';

export function ShareCard({ items, onClose, flash }: { items: VaultItem[]; onClose: () => void; flash: (message: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const save = async (share: boolean) => {
    if (!ref.current || busy) return;
    setBusy(true);
    try {
      await document.fonts.ready;
      const { toBlob } = await import('html-to-image');
      const blob = await toBlob(ref.current, { pixelRatio: 2, cacheBust: true });
      if (!blob) throw new Error('empty');
      const file = new File([blob], '奶油貓-我的扭蛋收藏.png', { type: 'image/png' });
      if (share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: '奶油貓・我的扭蛋收藏' });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = file.name; a.click();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        flash(share ? '此瀏覽器不支援直接分享，已下載收藏卡' : '收藏卡已下載');
      }
    } catch (e) {
      if (!(e instanceof Error && e.name === 'AbortError')) flash('分享卡製作失敗，請再試一次');
    } finally { setBusy(false); }
  };
  return <div className="bg-overlay fixed inset-0 z-[60] flex items-center justify-center p-4"><section role="dialog" aria-modal="true" aria-label="我的扭蛋分享卡" className="max-h-[90dvh] w-full max-w-sm overflow-y-auto rounded-lg bg-card p-4">
    <div className="mb-3 flex items-center justify-between"><h2 className="font-bold">我的收藏卡</h2><Button variant="ghost" size="icon" aria-label="關閉分享卡" onClick={onClose}><X /></Button></div>
    <div ref={ref} className="share-print border border-border bg-background p-5 text-center">
      <img src={catLogo} alt="奶油貓" className="mx-auto h-12 w-12 object-contain" />
      <p className="mt-2 text-xs text-secondary-foreground">クリームキャット ガチャ屋</p><h3 className="mb-5 mt-1 text-xl font-bold">今天的小幸福</h3>
      <div className="grid grid-cols-2 gap-3">{items.map((i) => <div key={i.vaultId}><img src={i.image} alt={i.name} className="aspect-square w-full rounded-lg bg-card object-contain" /><p className="mt-2 break-words text-xs font-bold">{i.isLastOne && '🎊 最後賞・'}{i.name}</p></div>)}</div>
      <p className="mt-5 border-t border-border pt-3 text-xs font-bold">奶油貓・日本正版扭蛋</p><p className="mt-1 text-[10px] text-muted-foreground">ガチャっと、しあわせ。</p>
    </div>
    <div className="mt-4 grid grid-cols-2 gap-2"><Button variant="outline" disabled={busy} onClick={() => save(false)}><Download />下載圖片</Button><Button disabled={busy} onClick={() => save(true)}><Share2 />{busy ? '製作中…' : '分享收藏'}</Button></div>
  </section></div>;
}