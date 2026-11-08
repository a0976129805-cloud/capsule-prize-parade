import { Button } from '@/components/ui/button';
import { Dialog, DialogPortal, DialogOverlay, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Share2, X } from 'lucide-react';
import type { VaultItem } from '@/lib/gacha.functions';

export function DrawResultDialog({ items, canRepeat, onClose, onRepeat, onVault, onShare }: {
  items: VaultItem[]; canRepeat: boolean; onClose: () => void; onRepeat: () => void; onVault: () => void; onShare: () => void;
}) {
  const lastOne = items.some((item) => item.isLastOne);
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}><DialogPortal>
    <DialogOverlay className="bg-overlay" />
    <DialogPrimitive.Content aria-label="扭蛋開獎結果" className="fixed left-1/2 top-1/2 z-50 max-h-[88dvh] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg bg-card p-5 text-center shadow-lg">
      <div className="mb-3 flex justify-end"><Button variant="secondary" size="icon" aria-label="關閉開獎結果" title="關閉開獎結果" onClick={onClose} className="h-11 w-11 rounded-full"><X /></Button></div>
      <DialogTitle className="text-xl font-bold text-primary">{lastOne ? '🎊 ラストワン賞！' : '🎉 おめでとう！'}</DialogTitle>
      {lastOne && <p className="my-2 rounded-lg bg-accent p-3 text-sm font-bold text-accent-foreground">恭喜抽走最後一顆！最後賞已一併存入倉庫。</p>}
      <DialogDescription className="mb-4 mt-2 text-sm text-muted-foreground">商品已成功存入您的個人倉庫！</DialogDescription>
      <div className="grid grid-cols-3 gap-2">{items.map((item) => <div key={item.vaultId} className="min-w-0 animate-pop"><img src={item.image} alt={item.name} className="aspect-square w-full rounded-lg object-cover" /><p className="mt-1 break-words text-xs">{item.isLastOne && '🎊 最後賞・'}{item.name}</p></div>)}</div>
      <div className="mt-5 grid grid-cols-2 gap-2"><Button variant="outline" disabled={!canRepeat} onClick={onRepeat} className="h-11 rounded-full border-primary text-primary">再抽一次</Button><Button onClick={onVault} className="h-11 rounded-full">查看倉庫</Button></div>
      <Button variant="ghost" className="mt-3 w-full" onClick={onShare}><Share2 />製作我的收藏分享卡</Button>
      <Button variant="ghost" className="mt-1 w-full text-muted-foreground" onClick={onClose}>關閉・繼續逛逛</Button>
    </DialogPrimitive.Content>
  </DialogPortal></Dialog>;
}