import { useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { Instagram, Trash2, Edit3, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMember } from '@/components/boutique/member-session';
import { listGroupBuys, myGroupJoins, toggleGroupJoin, adminSaveGroupBuy, adminDeleteGroupBuy, type GroupBuy } from '@/lib/group-buy.functions';

/** Floating side tab; sits above the dock so it never covers buy buttons. */
export function GroupBuyBadge() {
  return <Link to="/group-buys" aria-label="預購開團" className="group-badge fixed right-0 top-[42%] z-20 flex flex-col items-center gap-1 rounded-l-xl border border-r-0 border-border bg-card px-1.5 py-2.5 text-primary shadow-md">
    <span aria-hidden="true" className="group-badge-seal"><svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round"><path d="M2 19 9.5 7l2.5 3 2-2.5L22 19zM7.6 10l1.9 1.6 2.5-1.6 2 1.4 1.5-1.2" /></svg><b className="group-badge-hot">HOT</b></span>
    <span className="text-[11px] font-bold leading-tight [writing-mode:vertical-rl] tracking-[0.2em]">預購開團</span>
  </Link>;
}

const STATUS: Record<GroupBuy['status'], string> = { open: '募集中', success: '已成團', closed: '已結束' };

export function GroupBuyBoard({ igUrl, flash }: { igUrl: string; flash: (m: string) => void }) {
  const member = useMember(); const navigate = useNavigate();
  const fetchList = useServerFn(listGroupBuys); const fetchMine = useServerFn(myGroupJoins); const toggle = useServerFn(toggleGroupJoin);
  const [list, setList] = useState<GroupBuy[] | null>(null); const [mine, setMine] = useState<string[]>([]); const [busy, setBusy] = useState<string | null>(null);
  const load = () => fetchList().then(setList).catch(() => setList([]));
  useEffect(() => { void load(); }, []);
  useEffect(() => { if (member.ready && member.userId) void fetchMine().then(setMine).catch(() => {}); else setMine([]); }, [member.ready, member.userId]);
  const act = async (g: GroupBuy) => {
    if (!member.userId) return navigate({ to: '/auth' });
    const join = !mine.includes(g.id); setBusy(g.id);
    try { await toggle({ data: { groupId: g.id, join } }); setMine(m => join ? [...m, g.id] : m.filter(x => x !== g.id)); await load(); flash(join ? '已登記跟團，成團後店長會與你聯繫' : '已取消登記'); }
    catch (e) { flash(e instanceof Error ? e.message : '登記失敗'); } finally { setBusy(null); }
  };
  return <div className="space-y-5">
    <div className="border-b border-border pb-4"><p className="text-xs text-secondary-foreground">予約共同購入</p><h1 className="mt-1 text-2xl font-bold">預購開團</h1><p className="mt-2 text-sm leading-relaxed text-muted-foreground">店長看好的日本新品，整套預購。登記達目標組數即成團，店長再去日本帶回。</p></div>
    {list === null && <p className="py-8 text-center text-sm text-muted-foreground" role="status">讀取中…</p>}
    {list?.length === 0 && <p className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">目前沒有開團，敬請期待</p>}
    <div className="grid gap-4 sm:grid-cols-2">{list?.map(g => { const pct = Math.min(100, Math.round(g.joined / g.target * 100)); const joined = mine.includes(g.id); return <article key={g.id} className="polaroid-card overflow-hidden rounded-lg border border-border bg-card p-2">
      <div className="relative aspect-square overflow-hidden rounded-sm bg-muted">{g.image && <img src={g.image} alt={g.title} loading="lazy" className="h-full w-full object-cover" />}<span className="absolute left-2 top-2 rounded-full bg-card/95 px-2.5 py-0.5 text-[11px] font-bold text-primary">{STATUS[g.status]}</span></div>
      <div className="space-y-2 px-1 pb-1 pt-3">
        <h2 className="text-sm font-bold leading-snug">{g.title}</h2>
        <dl className="grid grid-cols-3 gap-1 text-center text-[11px]"><div className="rounded-md bg-muted py-1.5"><dt className="text-muted-foreground">整套</dt><dd className="font-bold text-primary">NT${g.setPrice}</dd></div><div className="rounded-md bg-muted py-1.5"><dt className="text-muted-foreground">款式</dt><dd className="font-bold">全 {g.styleCount} 種</dd></div><div className="rounded-md bg-muted py-1.5"><dt className="text-muted-foreground">預計抵台</dt><dd className="font-bold">{g.eta || '待定'}</dd></div></dl>
        <div><div className="flex justify-between text-[11px]"><span className="text-muted-foreground">成團進度</span><span className="font-bold tabular-nums">{g.joined}/{g.target} 組</span></div><div className="mt-1 h-3 overflow-hidden rounded-full border border-border bg-secondary p-px" role="progressbar" aria-valuenow={g.joined} aria-valuemax={g.target}><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} /></div></div>
        {g.status === 'open' ? <Button className="w-full rounded-full" variant={joined ? 'outline' : 'default'} disabled={busy === g.id || !member.ready} onClick={() => act(g)}>{!member.userId ? '登入會員後跟團' : joined ? '已登記・取消' : '我要跟團（整套）'}</Button> : <p className="text-center text-xs text-muted-foreground">{g.status === 'success' ? '已成團，店長將聯繫登記會員' : '本團已結束'}</p>}
      </div>
    </article>; })}</div>
    <section className="space-y-1 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground"><p className="font-bold text-foreground">跟團須知</p><p>・登記不需付款；成團後店長會聯繫確認，商品回台後與倉庫流程相同，以 7-11 賣貨便取貨付款。</p><p>・未達目標組數則不成團，登記自動失效。實物以日本官方發售為準。</p></section>
    <section className="rounded-lg border border-border bg-card p-4 text-center"><p className="text-sm font-bold">有看到想要的日本扭蛋？</p><p className="mt-1 text-xs text-muted-foreground">截圖私訊店長 IG，有機會成為下一團（依檔期與貨況，不保證找得到）。</p>{igUrl && <Button asChild variant="outline" size="sm" className="mt-3 rounded-full"><a href={igUrl} target="_blank" rel="noopener noreferrer"><Instagram />私訊店長 IG 許願</a></Button>}</section>
  </div>;
}

const blank: Omit<GroupBuy, 'joined' | 'id'> & { id?: string } = { title: '', image: '', setPrice: 0, styleCount: 5, eta: '', target: 5, status: 'open', sort: 0 };

export function GroupBuyAdmin({ flash, upload }: { flash: (m: string) => void; upload: (onDone: (url: string) => void) => ReactNode }) {
  const fetchList = useServerFn(listGroupBuys); const save = useServerFn(adminSaveGroupBuy); const del = useServerFn(adminDeleteGroupBuy);
  const [list, setList] = useState<GroupBuy[]>([]); const [edit, setEdit] = useState<typeof blank | null>(null);
  const load = () => fetchList().then(setList).catch(() => flash('讀取開團失敗'));
  useEffect(() => { void load(); }, []);
  const field = 'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm';
  if (edit) return <div className="space-y-2">
    <input className={field} placeholder="扭蛋名稱" value={edit.title} onChange={e => setEdit({ ...edit, title: e.target.value })} />
    <div className="flex items-center gap-3">{edit.image ? <img src={edit.image} alt="" className="h-16 w-16 rounded-lg object-cover" /> : <div className="h-16 w-16 rounded-lg bg-muted" />}{upload(url => setEdit(x => x && { ...x, image: url }))}</div>
    <div className="grid grid-cols-2 gap-2">
      <label className="text-xs">整套價格<input type="number" min={0} className={field} value={edit.setPrice} onChange={e => setEdit({ ...edit, setPrice: +e.target.value })} /></label>
      <label className="text-xs">款式數<input type="number" min={1} className={field} value={edit.styleCount} onChange={e => setEdit({ ...edit, styleCount: +e.target.value })} /></label>
      <label className="text-xs">成團組數<input type="number" min={1} className={field} value={edit.target} onChange={e => setEdit({ ...edit, target: +e.target.value })} /></label>
      <label className="text-xs">預計抵台（例：2027年1月）<input className={field} value={edit.eta} onChange={e => setEdit({ ...edit, eta: e.target.value })} /></label>
      <label className="text-xs">狀態<select className={field} value={edit.status} onChange={e => setEdit({ ...edit, status: e.target.value as GroupBuy['status'] })}><option value="open">募集中</option><option value="success">已成團</option><option value="closed">已結束</option></select></label>
      <label className="text-xs">排序（小的在前）<input type="number" className={field} value={edit.sort} onChange={e => setEdit({ ...edit, sort: +e.target.value })} /></label>
    </div>
    <div className="flex gap-2"><Button variant="outline" className="flex-1" onClick={() => setEdit(null)}>取消</Button><Button className="flex-1" onClick={async () => { try { await save({ data: edit }); setEdit(null); await load(); flash('已儲存'); } catch (e) { flash(e instanceof Error ? e.message : '儲存失敗'); } }}>儲存</Button></div>
  </div>;
  return <div className="space-y-2">
    <Button className="w-full" onClick={() => setEdit({ ...blank })}><Plus />新增開團</Button>
    {list.map(g => <div key={g.id} className="flex items-center gap-2 rounded-lg border border-border bg-card p-2 text-sm">{g.image ? <img src={g.image} alt="" className="h-12 w-12 rounded object-cover" /> : <div className="h-12 w-12 rounded bg-muted" />}<div className="min-w-0 flex-1"><p className="truncate font-bold">{g.title}</p><p className="text-xs text-muted-foreground">{STATUS[g.status]}・{g.joined}/{g.target} 組</p></div><Button size="icon" variant="ghost" aria-label="編輯" onClick={() => { const { joined: _j, ...rest } = g; setEdit(rest); }}><Edit3 /></Button><Button size="icon" variant="ghost" aria-label="刪除" onClick={async () => { if (!confirm('確定刪除此團？登記紀錄會一併刪除')) return; try { await del({ data: { id: g.id } }); await load(); } catch { flash('刪除失敗'); } }}><Trash2 /></Button></div>)}
  </div>;
}
