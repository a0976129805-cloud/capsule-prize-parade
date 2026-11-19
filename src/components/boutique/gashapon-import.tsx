import { useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { adminImportGashapon } from '@/lib/gashapon.functions';
import { gashaponProductUrl, type GashaponDraft } from '@/lib/gashapon-import';

export function GashaponImport({ onImported, flash }: { onImported: (draft: GashaponDraft) => void; flash: (m: string) => void }) {
  const importPage = useServerFn(adminImportGashapon);
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!gashaponProductUrl(url)) return flash('請貼上萬代官網 gashapon.jp 的商品頁網址');
    setBusy(true);
    try { onImported(await importPage({ data: { url } })); setUrl(''); }
    catch (err) { flash(err instanceof Error && err.message !== 'Forbidden' ? err.message : '匯入失敗，請重新登入後台再試'); }
    finally { setBusy(false); }
  };
  return <form onSubmit={run} className="space-y-2 rounded-lg border border-dashed border-primary/50 bg-card p-3">
    <p className="flex items-center gap-1 text-sm font-bold"><Download className="h-4 w-4 text-primary" aria-hidden="true" />從萬代官網匯入</p>
    <p className="text-xs leading-relaxed text-muted-foreground">貼上 gashapon.jp 商品頁網址，會帶入名稱、封面與款式照片。不會直接上架，台幣售價和庫存仍要你填好再儲存。</p>
    <div className="flex gap-2">
      <input type="url" inputMode="url" aria-label="萬代官網商品頁網址" placeholder="https://gashapon.jp/products/detail.php?jan_code=…" value={url} onChange={(e) => setUrl(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm" />
      <Button type="submit" className="shrink-0 rounded-full" disabled={busy || !url.trim()}>{busy ? '讀取中…' : '匯入'}</Button>
    </div>
  </form>;
}

export function ImportNotice({ draft }: { draft: GashaponDraft }) {
  const missing = (draft.cover ? 0 : 1) + draft.items.filter((i) => !i.image).length;
  return <section aria-label="匯入資料" className="space-y-1 rounded-lg bg-secondary/60 p-3 text-xs leading-relaxed text-secondary-foreground">
    <p className="font-bold">已從萬代官網帶入，請檢查後再儲存</p>
    <p>日本售價 {draft.yenPrice ? `¥${draft.yenPrice}` : '未標示'}・官方 {draft.styleCount ? `全 ${draft.styleCount} 種` : '款式數未標示'}・發售 {draft.release || '未標示'}</p>
    <ul className="list-disc pl-4">
      <li>單價與每款庫存先設為 0，請填好台幣售價與你實際買到的數量。</li>
      <li>款式名稱是日文，可以改成中文。</li>
      {!draft.stylesFromPage && <li>官網沒有各款單獨照片，先用封面代替，款式名稱也要自己填。</li>}
      {draft.styleCount !== null && draft.stylesFromPage && draft.items.length !== draft.styleCount && <li>官網寫全 {draft.styleCount} 種，但只抓到 {draft.items.length} 款照片，請對照官網補齊。</li>}
      {missing > 0 && <li>有 {missing} 張照片沒有複製成功，請自己上傳。</li>}
      <li>還沒買到的話，記得把供貨方式改成「日本預購」並設定出貨日期。</li>
    </ul>
    <a href={draft.sourceUrl} target="_blank" rel="noreferrer" className="inline-block font-bold text-primary underline underline-offset-2">打開萬代官網對照</a>
  </section>;
}
