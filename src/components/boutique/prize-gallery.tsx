import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogPortal, DialogOverlay, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { ChevronLeft, ChevronRight, RotateCw, X } from 'lucide-react';
import type { Machine } from '@/lib/gacha.functions';

export function PrizeGallery({ machine, index, onIndex, onClose, onDraw }: { machine: Machine; index: number; onIndex: (index: number) => void; onClose: () => void; onDraw: () => void }) {
  const item = machine.items[index];
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') onIndex((index + 1) % machine.items.length);
      if (event.key === 'ArrowLeft') onIndex((index - 1 + machine.items.length) % machine.items.length);
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [index, machine.items.length, onIndex]);
  if (!item) return null;
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}><DialogPortal>
    <DialogOverlay className="bg-overlay" />
    <DialogPrimitive.Content className="prize-gallery fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-border bg-card p-4 shadow-lg">
      <div className="mb-3 flex items-center justify-between"><span className="text-xs font-bold text-secondary-foreground">コレクション · {index + 1} / {machine.items.length}</span><Button variant="ghost" size="icon" aria-label="關閉商品大圖" onClick={onClose}><X /></Button></div>
      <div className="relative bg-muted"><img src={item.image || machine.coverImage} alt={item.name} className="gallery-photo aspect-square w-full object-contain" />
        {machine.items.length > 1 && <><Button variant="secondary" size="icon" aria-label="上一款" onClick={() => onIndex((index - 1 + machine.items.length) % machine.items.length)} className="absolute left-1 top-1/2 -translate-y-1/2 rounded-full"><ChevronLeft /></Button><Button variant="secondary" size="icon" aria-label="下一款" onClick={() => onIndex((index + 1) % machine.items.length)} className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full"><ChevronRight /></Button></>}
      </div>
      <DialogTitle className="mt-4 break-words pr-2 text-lg font-bold">{item.name}</DialogTitle>
      <DialogDescription className="mt-2 text-xs leading-relaxed">{machine.title} · {item.stock > 0 ? `剩餘 ${item.stock} 顆` : '此款已售完'}<br />隨機抽出一款，無法指定款式，也可能抽到重複商品。</DialogDescription>
      <Button disabled={machine.totalStock < 1} onClick={onDraw} className="mt-4 h-12 w-full rounded-full"><RotateCw />{machine.totalStock > 0 ? `隨機單抽 · NT$${machine.price}` : '本機台已完售'}</Button>
    </DialogPrimitive.Content>
  </DialogPortal></Dialog>;
}