import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import shrine from '@/assets/omikuji-shrine.jpg';

export type OmikujiState = { phase: 'shaking' } | { phase: 'result'; title: string; detail: string } | { phase: 'error'; detail: string };

export function OmikujiDraw({ state, onClose }: { state: OmikujiState | null; onClose: () => void }) {
  const shaking = state?.phase === 'shaking';
  return <Dialog open={!!state} onOpenChange={(o) => { if (!o && !shaking) onClose(); }}>
    <DialogContent className="max-w-sm overflow-hidden rounded-2xl p-0" onInteractOutside={(e) => { if (shaking) e.preventDefault(); }}>
      <DialogTitle className="sr-only">每日御神籤</DialogTitle>
      <DialogDescription className="sr-only">搖籤結果</DialogDescription>
      <div className="relative">
        <img src={shrine} alt="奶油貓神社與御神籤箱" width={1024} height={768} className={`aspect-[4/3] w-full object-cover ${shaking ? 'omikuji-shake' : ''}`} />
        {shaking && <div className="omikuji-stick absolute left-[33%] top-[40%] h-16 w-2 rounded-sm bg-card shadow" aria-hidden />}
      </div>
      <div className="p-5 text-center">
        {shaking && <p role="status" className="font-bold">カラカラ… 正在搖籤</p>}
        {state?.phase === 'result' && <div className="omikuji-paper mx-auto max-w-[14rem] rounded-sm border-2 border-primary bg-card px-4 py-5">
          <p className="text-xs font-bold text-primary">御神籤</p>
          <p className="mt-2 text-3xl font-bold tracking-widest text-primary">{state.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{state.detail}</p>
        </div>}
        {state?.phase === 'error' && <p className="text-sm text-muted-foreground">{state.detail}</p>}
        {!shaking && <Button className="mt-4 w-full" onClick={onClose}>收下・回到票夾</Button>}
      </div>
    </DialogContent>
  </Dialog>;
}
