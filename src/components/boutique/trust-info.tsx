import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { trustArt } from './trust-art';
import { FREE_SHIP_AMOUNT, SHIP_FEE } from '@/lib/shipping';

export type TrustTopic = 'cod' | 'genuine' | 'shipping';

const topics: Record<TrustTopic, { tag: string; title: string; points: string[] }> = {
  cod: {
    tag: '代金引換',
    title: '7-11 貨到付款',
    points: [
      '申請出貨時選擇你方便的 7-11 門市，商品到店後再付款取貨。',
      '本站不要求 ATM 操作或提前匯款，遇到要求轉帳的訊息請先聯繫店長確認。',
      '訂單由店長整理後透過 7-11 賣貨便寄出，本站不是 7-11 官方網站。',
      '到店後會收到取貨通知，請留意簡訊並於期限內取貨。',
    ],
  },
  genuine: {
    tag: '日本正規品',
    title: '日本正版扭蛋',
    points: [
      '店長住在日本，從當地扭蛋店親自挑選正版商品。',
      '每顆扭蛋附日本原廠蛋紙（說明書），收藏更完整。',
      '抽中的商品會存進倉庫，可保存 24 小時，再一次整倉出貨。',
      '商品圖以實物為主，若有疑問歡迎透過 LINE 詢問店長。',
    ],
  },
  shipping: {
    tag: '送料無料',
    title: '全館滿千免運',
    points: [
      `單筆商品金額滿 NT$${FREE_SHIP_AMOUNT.toLocaleString()} 免運，未滿運費 NT$${SHIP_FEE}。`,
      '抽中的扭蛋與整套直購合併計算，一次出貨更划算。',
      '使用折價券時，免運門檻依折扣前的商品金額計算。',
      '倉庫商品須整倉一次出貨，無法拆分寄送。',
    ],
  },
};

export function TrustInfoDialog({ topic, onClose }: { topic: TrustTopic | null; onClose: () => void }) {
  const t = topic ? topics[topic] : null;
  return <Dialog open={!!t} onOpenChange={(o) => { if (!o) onClose(); }}>
    <DialogContent className="max-w-sm overflow-hidden rounded-2xl">
      {t && topic && <><img src={trustArt[topic]} alt={t.title} width={1024} height={768} className="-mx-6 -mt-6 aspect-[4/3] w-[calc(100%+3rem)] max-w-none object-cover" /><DialogHeader className="text-left">
        <p className="text-xs font-bold text-secondary-foreground">{t.tag}</p>
        <DialogTitle className="text-xl">{t.title}</DialogTitle>
        <DialogDescription className="sr-only">{t.title}說明</DialogDescription>
      </DialogHeader>
      <ul className="space-y-3 text-sm leading-relaxed">{t.points.map((p) => <li key={p} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{p}</li>)}</ul></>}
    </DialogContent>
  </Dialog>;
}
