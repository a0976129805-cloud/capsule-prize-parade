import { useId, useState, type FormEvent } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useQueryClient } from '@tanstack/react-query';
import { Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { redeemPromoCode } from '@/lib/promo-codes.functions';
import type { RedeemedPromo } from '@/lib/promo-codes';

/** The same member-checked redemption flow is used by the homepage and wallet. */
export function PromoRedeemForm({ autoFocus = false }: { autoFocus?: boolean }) {
  const inputId = useId();
  const navigate = useNavigate();
  const redeemFn = useServerFn(redeemPromoCode);
  const cache = useQueryClient();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [redeemed, setRedeemed] = useState<RedeemedPromo | null>(null);

  const redeem = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await redeemFn({ data: { code } });
      setCode('');
      setRedeemed(result);
      await cache.invalidateQueries({ queryKey: ['member-wallet'] });
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : '兌換失敗，請稍後再試';
      setError(/unauthorized|authorization|登入/i.test(message) ? '請先登入會員，再輸入暗號領券。' : message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="space-y-2">
        <form className="flex gap-2" onSubmit={redeem}>
          <label className="sr-only" htmlFor={inputId}>優惠代碼</label>
          <input
            id={inputId}
            required
            minLength={2}
            maxLength={32}
            autoFocus={autoFocus}
            autoCapitalize="characters"
            autoComplete="off"
            className="h-11 min-w-0 flex-1 rounded-full border border-input bg-background px-4 text-sm uppercase outline-none focus:ring-2 focus:ring-ring"
            placeholder="輸入店長給你的暗號"
            value={code}
            onChange={(event) => {
              setCode(event.target.value.toUpperCase());
              setError('');
            }}
          />
          <Button type="submit" className="h-11 rounded-full" disabled={busy || code.trim().length < 2}>
            {busy ? '兌換中…' : '兌換'}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground">不分大小寫・需登入會員・每組代碼每位會員限領一次</p>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      </div>
      <Dialog open={!!redeemed} onOpenChange={(open) => { if (!open) setRedeemed(null); }}>
        {redeemed && (
          <DialogContent className="max-w-sm rounded-2xl">
            <DialogHeader className="text-center">
              <Gift className="mx-auto h-10 w-10 text-primary" />
              <DialogTitle className="text-xl">暗號兌換成功！</DialogTitle>
              <DialogDescription>{redeemed.name} 已存入你的票夾</DialogDescription>
            </DialogHeader>
            <div className="rounded-xl border border-dashed border-primary/50 bg-card p-4 text-center">
              <p className="text-2xl font-bold text-primary">滿 NT${redeemed.minimum} 折 NT${redeemed.amount}</p>
              <p className="mt-2 text-xs text-muted-foreground">有效至 {new Date(redeemed.expires_at).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}（台灣時間）</p>
            </div>
            <p className="text-center text-xs text-muted-foreground">結帳時可選用，每筆訂單限用一張。</p>
            <Button className="w-full" onClick={() => { setRedeemed(null); void navigate({ to: '/machines', search: { q: '' } }); }}>去逛扭蛋機</Button>
            <Button variant="outline" className="w-full" onClick={() => setRedeemed(null)}>繼續逛逛</Button>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
