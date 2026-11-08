import { useEffect, useRef, useState } from 'react';
import { renderPng, shareOrDownload } from '@/lib/share-image';
import { Button } from '@/components/ui/button';
import { Download, Share2, X } from 'lucide-react';
import type { VaultItem } from '@/lib/gacha.functions';
import catLogo from '@/assets/cat-logo.png';

export function ShareCard({ items, onClose, flash }: { items: VaultItem[]; onClose: () => void; flash: (message: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    const t = setTimeout(() => { if (ref.current) renderPng(ref.current).then((b) => { if (alive) setFile(new File([b], '奶油貓-我的扭蛋收藏.png', { type: 'image/png' })); }).catch(() => {}); }, 400);
    return () => { alive = false; clearTimeout(t); };
  }, []);
  const save = async (share: boolean) => {
    if (!ref.current || busy) return;
    setBusy(true);
    try {
      const f = file ?? new File([await renderPng(ref.current)], '奶油貓-我的扭蛋收藏.png', { type: 'image/png' });
      setFile(f);
      const r = await shareOrDownload(f, share, { title: '奶油貓・我的扭蛋收藏' });
      if (r === 'downloaded') { setPreview(URL.createObjectURL(f)); flash(share ? '已產生圖片，可長按圖片儲存或分享' : '收藏卡已下載'); }
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
    {preview && <div className="mt-3 text-center"><p className="mb-1 text-xs text-muted-foreground">長按下方圖片即可儲存或分享</p><img src={preview} alt="我的扭蛋收藏卡圖片" className="mx-auto w-full rounded-lg border border-border" /></div>}
    <div className="mt-4 grid grid-cols-2 gap-2"><Button variant="outline" disabled={busy} onClick={() => save(false)}><Download />下載圖片</Button><Button disabled={busy} onClick={() => save(true)}><Share2 />{busy ? '製作中…' : file ? '分享收藏' : '準備中…'}</Button></div>
  </section></div>;
}