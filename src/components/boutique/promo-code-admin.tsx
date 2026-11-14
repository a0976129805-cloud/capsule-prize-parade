import { useEffect, useState, type FormEvent } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { Plus, RefreshCw, Ticket, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { adminCreatePromoCode, adminDeletePromoCode, adminPromoCodes, adminSetPromoCode } from '@/lib/promo-codes.functions';
import { emptyPromoCode, type PromoCode, type PromoCodeInput } from '@/lib/promo-codes';

const field = 'mt-1 w-full rounded-lg border border-input bg-background p-2 text-sm';

export function PromoCodeAdmin({ flash }: { flash: (message: string) => void }) {
  const list = useServerFn(adminPromoCodes);
  const create = useServerFn(adminCreatePromoCode);
  const setStatus = useServerFn(adminSetPromoCode);
  const remove = useServerFn(adminDeletePromoCode);
  const [items, setItems] = useState<PromoCode[]>([]);
  const [form, setForm] = useState<PromoCodeInput>(emptyPromoCode);
  const [busy, setBusy] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setItems(await list());
      setError('');
    } catch {
      setError('代碼讀取失敗，請重新進入後台。');
    } finally {
      setLoaded(true);
    }
  };
  useEffect(() => { void load(); }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy('create');
    setError('');
    try {
      const result = await create({ data: form });
      setForm(emptyPromoCode);
      await load();
      flash(`代碼 ${result.code} 已建立`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '建立代碼失敗');
    } finally {
      setBusy('');
    }
  };

  const toggle = async (item: PromoCode) => {
    setBusy(item.id);
    try {
      await setStatus({ data: { id: item.id, enabled: !item.enabled } });
      await load();
      flash(item.enabled ? '代碼已停用' : '代碼已開放兌換');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '更新失敗');
    } finally {
      setBusy('');
    }
  };

  const deleteCode = async (item: PromoCode) => {
    if (!window.confirm(`確定刪除代碼 ${item.code}？此動作無法復原。`)) return;
    setBusy(item.id);
    try {
      await remove({ data: { id: item.id } });
      await load();
      flash('代碼已刪除');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '刪除失敗');
    } finally {
      setBusy('');
    }
  };

  return <section className="space-y-5 border-b border-border pb-6">
    <div className="flex items-start justify-between gap-3">
      <div><p className="text-xs text-secondary-foreground">合言葉のプレゼント</p><h2 className="mt-1 flex items-center gap-2 text-lg font-bold"><Ticket className="size-5 text-primary" />優惠代碼</h2><p className="mt-1 text-xs text-muted-foreground">建立暗號，讓會員在票夾自行輸入領券。</p></div>
      <Button type="button" variant="outline" size="icon" aria-label="重新整理代碼" onClick={() => void load()}><RefreshCw className="size-4" /></Button>
    </div>

    <form className="space-y-3 rounded-xl border border-border bg-card p-4" onSubmit={submit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs">優惠代碼<input required className={field} value={form.code} maxLength={32} autoCapitalize="characters" placeholder="例如 THREADS100" onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })} /></label>
        <label className="text-xs">券名<input required className={field} value={form.name} maxLength={60} placeholder="例如 Threads 專屬見面禮" onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <label className="text-xs">折扣 NT$<input required type="number" min={1} max={10000} className={field} value={form.amount} onChange={(event) => setForm({ ...form, amount: Number(event.target.value) })} /></label>
        <label className="text-xs">最低消費 NT$<input required type="number" min={0} max={1000000} className={field} value={form.minimum} onChange={(event) => setForm({ ...form, minimum: Number(event.target.value) })} /></label>
        <label className="text-xs">有效天數<input required type="number" min={1} max={90} className={field} value={form.days} onChange={(event) => setForm({ ...form, days: Number(event.target.value) })} /></label>
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.enabled} onChange={(event) => setForm({ ...form, enabled: event.target.checked })} />建立後立即開放兌換（預設不開放）</label>
      <Button className="w-full" disabled={busy !== ''}><Plus className="size-4" />{busy === 'create' ? '建立中…' : '新增優惠代碼'}</Button>
    </form>

    {error && <p role="alert" className="break-words text-sm text-destructive">{error}</p>}
    <div className="space-y-3">
      {loaded && items.length === 0 && <p className="py-3 text-center text-sm text-muted-foreground">尚未建立優惠代碼</p>}
      {items.map((item) => <article key={item.id} className="space-y-3 rounded-xl border border-border p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0"><p className="break-all font-mono text-lg font-bold tracking-wide">{item.code}</p><h3 className="mt-1 break-words text-sm font-bold">{item.name}</h3></div>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${item.enabled ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground'}`}>{item.enabled ? '開放中' : '已停用'}</span>
        </div>
        <p className="text-sm">滿 NT${item.minimum} 折 <strong className="text-primary">NT${item.amount}</strong></p>
        <p className="text-xs text-muted-foreground">領取後 {item.days} 天有效・已領 {item.claims} 次・每位會員限一次</p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" disabled={busy !== ''} onClick={() => void toggle(item)}>{busy === item.id ? '更新中…' : item.enabled ? '停用代碼' : '開放兌換'}</Button>
          {item.claims === 0 ? <Button type="button" variant="ghost" size="sm" className="text-destructive" disabled={busy !== ''} onClick={() => void deleteCode(item)}><Trash2 className="size-4" />刪除</Button> : <span className="self-center text-xs text-muted-foreground">已有領取紀錄，請以停用結束活動</span>}
        </div>
      </article>)}
    </div>
    <p className="text-xs text-muted-foreground">代碼使用英文、數字、-、_，輸入時不分大小寫。停用或刪除不影響已發出的券；每筆訂單仍限用一張。</p>
  </section>;
}
