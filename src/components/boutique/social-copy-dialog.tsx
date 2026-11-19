import { useEffect, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { copyText } from '@/lib/machine-share';
import { buildSocialDrafts, type SocialDraft, type SocialMachine } from '@/lib/social-copy';

function CopyBox({ label, value, onChange, rows, flash }: { label: string; value: string; onChange: (v: string) => void; rows: number; flash: (m: string) => void }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try { await copyText(value); setDone(true); flash(`已複製${label}`); window.setTimeout(() => setDone(false), 2000); }
    catch { flash('複製失敗，請長按文字手動複製'); }
  };
  return <div className="space-y-1.5">
    <div className="flex items-center justify-between gap-2"><span className="text-xs font-bold">{label}</span>
      <Button type="button" size="sm" variant={done ? 'secondary' : 'default'} className="rounded-full" onClick={copy}>{done ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}{done ? '已複製' : '複製'}</Button></div>
    <textarea aria-label={label} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} className="w-full resize-y rounded-lg border border-input bg-background p-2.5 text-sm leading-relaxed" />
  </div>;
}

export function SocialCopyDialog({ machine, onClose, flash }: { machine: SocialMachine | null; onClose: () => void; flash: (m: string) => void }) {
  const [drafts, setDrafts] = useState<SocialDraft[]>([]);
  const [active, setActive] = useState<SocialDraft['id']>('threads');
  useEffect(() => {
    if (machine) { setDrafts(buildSocialDrafts(machine, window.location.origin)); setActive('threads'); }
  }, [machine]);
  const current = drafts.find((d) => d.id === active);
  const update = (patch: Partial<SocialDraft>) => setDrafts((all) => all.map((d) => d.id === active ? { ...d, ...patch } : d));
  const soldOut = !!machine && machine.items.every((i) => i.stock <= 0);

  return <Dialog open={!!machine} onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent className="max-h-[88dvh] w-[calc(100%-1.5rem)] max-w-md overflow-y-auto rounded-2xl">
      <DialogHeader className="text-left">
        <DialogTitle>社群文案・{machine?.title}</DialogTitle>
        <DialogDescription>只用這台機台的售價、款式與出貨設定產生；可以先改成自己的口吻再複製。</DialogDescription>
      </DialogHeader>
      {soldOut && <p role="alert" className="rounded-lg bg-muted p-2 text-xs text-destructive">這台目前沒有庫存，發文前請先補貨，避免客人點進來轉不到。</p>}
      <div role="tablist" aria-label="文案類型" className="grid grid-cols-3 gap-1 rounded-full bg-muted p-1">
        {drafts.map((d) => <Button key={d.id} role="tab" aria-selected={d.id === active} type="button" size="sm" variant={d.id === active ? 'default' : 'ghost'} className="rounded-full px-1 text-[11px]" onClick={() => setActive(d.id)}>{d.label}</Button>)}
      </div>
      {current && <div className="space-y-3">
        <p className="text-xs text-muted-foreground">{current.hint}</p>
        <CopyBox key={`${current.id}-body`} label={current.comment !== undefined ? '主文' : '文案'} rows={current.id === 'instagram' ? 9 : 5} value={current.body} onChange={(body) => update({ body })} flash={flash} />
        {current.comment !== undefined && <CopyBox key={`${current.id}-comment`} label="第一則留言" rows={2} value={current.comment} onChange={(comment) => update({ comment })} flash={flash} />}
      </div>}
    </DialogContent>
  </Dialog>;
}
