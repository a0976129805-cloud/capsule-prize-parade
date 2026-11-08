import { useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { ArrowUp, ArrowDown, ArrowUpToLine, Check, Undo2, Edit3, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { adminReorderMachines, type Machine } from '@/lib/gacha.functions';
import { moveMachine, type OrderMove } from '@/lib/machine-order';

export function MachineOrderList({ machines, reload, flash, onEdit, onDelete }: {
  machines: Machine[]; reload: () => Promise<void>; flash: (message: string) => void;
  onEdit: (machine: Machine) => void; onDelete: (id: string) => Promise<void>;
}) {
  const reorder = useServerFn(adminReorderMachines);
  const [draft, setDraft] = useState<{ ids: string[]; expected: string[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const ids = machines.map((m) => m.id);
  const ordered = draft ? draft.ids.flatMap((id) => { const m = machines.find((m) => m.id === id); return m ? [m] : []; }) : machines;
  const move = (id: string, direction: OrderMove) => setDraft((previous) => ({
    expected: previous?.expected ?? ids,
    ids: moveMachine(previous?.ids ?? ids, id, direction),
  }));
  const save = async () => {
    if (!draft || busy) return;
    setBusy(true);
    try {
      await reorder({ data: draft });
      await reload(); setDraft(null); flash('已儲存機台順序');
    } catch (error) {
      if (error instanceof Error && error.message.includes('順序已變更')) {
        await reload(); setDraft(null); flash('機台清單已更新，請重新排列');
      } else flash('儲存排序失敗，請再試一次');
    } finally { setBusy(false); }
  };
  return <section aria-label="機台排列" className="space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
      <h2 className="text-sm font-bold">機台排列 {draft && <span className="text-xs text-primary">・尚未儲存</span>}</h2>
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" title="還原排列" aria-label="還原排列" disabled={!draft || busy} onClick={() => setDraft(null)}><Undo2 /></Button>
        <Button size="sm" disabled={!draft || busy} onClick={save}><Check />{busy ? '儲存中…' : '儲存排序'}</Button>
      </div>
    </div>
    {ordered.map((m, index) => <article key={m.id} data-machine-id={m.id} className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-3">
        <img src={m.coverImage} alt="" className="h-14 w-14 shrink-0 rounded-lg bg-muted object-cover" />
        <div className="min-w-0 flex-1"><p className="text-[10px] font-bold text-secondary-foreground">第 {index + 1} 台</p><p className="break-words text-sm font-bold">{m.title}</p><p className="text-xs text-muted-foreground">NT${m.price}・庫存 {m.totalStock}・{m.items.length} 款</p></div>
      </div>
      <div className="mt-2 flex items-center gap-1 border-t border-border pt-2">
        <Button variant="secondary" size="icon" title="移到最前" aria-label={`移到最前 ${m.title}`} disabled={busy || index === 0} onClick={() => move(m.id, 'top')}><ArrowUpToLine /></Button>
        <Button variant="ghost" size="icon" title="上移一台" aria-label={`上移 ${m.title}`} disabled={busy || index === 0} onClick={() => move(m.id, 'up')}><ArrowUp /></Button>
        <Button variant="ghost" size="icon" title="下移一台" aria-label={`下移 ${m.title}`} disabled={busy || index === ordered.length - 1} onClick={() => move(m.id, 'down')}><ArrowDown /></Button>
        <Button variant="ghost" size="icon" className="ml-auto" title="編輯機台" aria-label={`編輯 ${m.title}`} disabled={busy || !!draft} onClick={() => onEdit(m)}><Edit3 /></Button>
        <Button variant="ghost" size="icon" className="text-destructive" title="刪除機台" aria-label={`刪除 ${m.title}`} disabled={busy || !!draft} onClick={() => onDelete(m.id)}><Trash2 /></Button>
      </div>
    </article>)}
  </section>;
}