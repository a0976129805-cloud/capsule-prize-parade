import { useEffect, useRef, useState } from 'react';
import { renderPng, shareOrDownload } from '@/lib/share-image';
import { Button } from '@/components/ui/button';
import { Download, PawPrint, Share2, X } from 'lucide-react';
import type { VaultItem } from '@/lib/gacha.functions';
import catLogo from '@/assets/cat-logo.png';

function CertificationStamp() {
  return <div className="share-stamp" aria-label="奶油貓認證">
    <PawPrint aria-hidden="true" />
    <span>奶油貓</span>
    <small>認 證</small>
  </div>;
}

export function ShareCard({ items, onClose, flash }: { items: VaultItem[]; onClose: () => void; flash: (message: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<'download' | 'share' | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  const save = async (share: boolean) => {
    if (!ref.current || busy) return;
    setBusy(share ? 'share' : 'download');
    try {
      const f = file ?? new File([await renderPng(ref.current)], '奶油貓-本日的小幸運.png', { type: 'image/png' });
      setFile(f);
      const names = items.filter(item => !item.isLastOne).map(item => item.name).join('、');
      const r = await shareOrDownload(f, share, { title: '奶油貓・本日的小幸運', text: `我在奶油貓轉到了${names ? `「${names}」` : '小驚喜'}！` });
      if (r === 'downloaded') {
        setPreview(URL.createObjectURL(f));
        flash(share ? '圖片已產生，可長按圖片儲存或分享' : '拍立得分享圖已下載');
      }
    } catch (e) {
      if (!(e instanceof Error && e.name === 'AbortError')) flash('分享卡製作失敗，請再試一次');
    } finally { setBusy(null); }
  };
  return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-overlay p-4"><section role="dialog" aria-modal="true" aria-label="我的扭蛋拍立得分享卡" className="max-h-[92dvh] w-full max-w-sm overflow-y-auto rounded-lg bg-card p-4">
    <div className="mb-3 flex items-center justify-between"><div className="text-left"><p className="text-[10px] tracking-widest text-secondary-foreground">GACHA MEMORIES</p><h2 className="font-bold">把今天的好運裝進照片</h2></div><Button variant="ghost" size="icon" aria-label="關閉分享卡" onClick={onClose}><X /></Button></div>
    <div ref={ref} className="share-print share-polaroid bg-card text-card-foreground">
      <header className="flex items-center gap-2 border-b border-border pb-3 text-left">
        <img src={catLogo} alt="奶油貓" className="h-11 w-11 object-contain" />
        <div><p className="text-[10px] tracking-wider text-secondary-foreground">クリームキャット ガチャ屋</p><p className="text-sm font-bold">奶油貓・日本正版扭蛋</p></div>
        <span className="ml-auto text-[9px] tracking-widest text-muted-foreground">CREAM CAT</span>
      </header>
      <div className="share-photo mt-4 bg-muted p-3">
        <p className="mb-3 text-center font-handwritten text-xl text-secondary-foreground">本日の小さな幸せ</p>
        <div className={items.length === 1 ? 'mx-auto w-full' : 'grid grid-cols-2 gap-2'}>
          {items.map(item => <figure key={item.vaultId} className="min-w-0 bg-card p-1.5 shadow-sm">
            <img src={item.image} loading="eager" alt={item.name} className={`w-full bg-muted object-contain ${items.length === 1 ? 'aspect-square' : 'aspect-square'}`} />
            <figcaption className="min-h-8 break-words px-0.5 pb-0.5 pt-1.5 text-center text-[10px] font-bold leading-tight">{item.isLastOne && '最後賞・'}{item.name}</figcaption>
          </figure>)}
        </div>
      </div>
      <footer className="flex min-h-24 items-center gap-3 px-2 pb-1 pt-4 text-left">
        <div className="min-w-0 flex-1"><p className="font-handwritten text-2xl text-primary">ガチャっと、しあわせ。</p><p className="mt-1 text-[10px] text-muted-foreground">轉一顆扭蛋，收藏一點今天的快樂。</p></div>
        <CertificationStamp />
      </footer>
    </div>
    {preview && <div className="mt-3 text-center"><p className="mb-1 text-xs text-muted-foreground">長按下方圖片即可儲存或分享</p><img src={preview} alt="我的扭蛋拍立得分享圖" className="mx-auto w-full rounded-lg border border-border" /></div>}
    <div className="mt-4 grid grid-cols-2 gap-2"><Button variant="outline" disabled={!!busy} onClick={() => save(false)}><Download />{busy === 'download' ? '製作中…' : '下載分享圖'}</Button><Button disabled={!!busy} onClick={() => save(true)}><Share2 />{busy === 'share' ? '製作中…' : file ? '分享這次好運' : '製作並分享'}</Button></div>
    <p className="mt-2 text-center text-[10px] text-muted-foreground">若手機不支援直接分享，會自動改為下載圖片。</p>
  </section></div>;
}
