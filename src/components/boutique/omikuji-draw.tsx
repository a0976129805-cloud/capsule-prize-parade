import { useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import shrine from '@/assets/omikuji-shrine.jpg';
import tubeImg from '@/assets/omikuji-tube.jpg';

export type OmikujiState = { phase: 'ready' } | { phase: 'shaking' } | { phase: 'result'; title: string; detail: string } | { phase: 'error'; detail: string };

let ctx: AudioContext | null = null;
function audio() {
  if (typeof window === 'undefined') return null;
  try { ctx ??= new AudioContext(); if (ctx.state === 'suspended') void ctx.resume(); return ctx; } catch { return null; }
}
function knock(a: AudioContext, t: number, freq: number, vol = 0.18) {
  const o = a.createOscillator(); const g = a.createGain(); const f = a.createBiquadFilter();
  f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 6;
  o.type = 'triangle'; o.frequency.setValueAtTime(freq, t); o.frequency.exponentialRampToValueAtTime(freq * 0.6, t + 0.06);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
  o.connect(f).connect(g).connect(a.destination); o.start(t); o.stop(t + 0.1);
}
function rattle(a: AudioContext) {
  const t0 = a.currentTime;
  for (let i = 0; i < 22; i++) knock(a, t0 + i * 0.085 + Math.random() * 0.03, 700 + Math.random() * 900, 0.12 + Math.random() * 0.08);
}
function popAndChime(a: AudioContext) {
  const t = a.currentTime;
  knock(a, t, 520, 0.3);
  [784, 988, 1175, 1568].forEach((f, i) => {
    const o = a.createOscillator(); const g = a.createGain(); const s = t + 0.25 + i * 0.12;
    o.type = 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, s); g.gain.exponentialRampToValueAtTime(0.16, s + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, s + 1.2);
    o.connect(g).connect(a.destination); o.start(s); o.stop(s + 1.3);
  });
}

const BLESSINGS: Record<string, { ja: string; zh: string }> = {
  超大吉: { ja: '最高の幸運が舞い込みます！', zh: '天大好運降臨，今天做什麼都順利！' },
  大吉: { ja: '願い事が叶う予感がします。', zh: '心想事成，好事即將發生。' },
  中吉: { ja: '小さな幸せがたくさん届きます。', zh: '小確幸接連而來，保持好心情。' },
  吉: { ja: '穏やかで良い一日になりますように。', zh: '平安順心，祝你有美好的一天。' },
};
export function blessingFor(title: string) {
  return BLESSINGS[title] ?? Object.entries(BLESSINGS).find(([k]) => title.includes(k))?.[1] ?? BLESSINGS['吉'];
}

function Tube({ shaking, revealed }: { shaking: boolean; revealed: boolean }) {
  return <div className={`relative mx-auto w-32 ${shaking ? 'omikuji-tube-shake' : ''}`} style={{ transformOrigin: '50% 90%' }}>
    {revealed && <div className="omikuji-stick-out absolute left-1/2 top-0 z-0 h-20 w-2.5 -translate-x-1/2 rounded-sm border border-border bg-card shadow">
      <span className="absolute inset-x-0 top-1 h-3.5 rounded-sm bg-primary" />
    </div>}
    <img src={tubeImg} alt="御神籤籤筒" width={225} height={425} className="relative z-10 w-full rounded-xl" draggable={false} />
  </div>;
}

export function OmikujiDraw({ state, onShake, onClose }: { state: OmikujiState | null; onShake: () => void; onClose: () => void }) {
  const phase = state?.phase;
  const locked = phase === 'shaking';
  const played = useRef(false);
  useEffect(() => {
    if (phase === 'result' && !played.current) { played.current = true; const a = audio(); if (a) popAndChime(a); }
    if (phase !== 'result') played.current = false;
  }, [phase]);
  const shake = () => { const a = audio(); if (a) rattle(a); onShake(); };
  return <Dialog open={!!state} onOpenChange={(o) => { if (!o && !locked) onClose(); }}>
    <DialogContent className="max-w-sm overflow-hidden rounded-2xl p-0" onInteractOutside={(e) => { if (locked) e.preventDefault(); }}>
      <DialogTitle className="sr-only">每日御神籤</DialogTitle>
      <DialogDescription className="sr-only">點籤筒搖出今日的籤</DialogDescription>
      <img src={shrine} alt="" width={1024} height={768} className="aspect-[3/1] w-full object-cover" />
      <div className="p-5 text-center">
        {phase !== 'error' && phase !== 'result' && <>
          {phase === 'ready' && <div className="omikuji-arrow mb-1 text-sm font-bold text-primary" aria-hidden>點籤筒搖一搖 ▼</div>}
          <button type="button" disabled={phase !== 'ready'} onClick={shake} aria-label="點擊籤筒搖籤" className="rounded-xl p-2 focus-visible:outline-2 focus-visible:outline-primary">
            <Tube shaking={phase === 'shaking'} revealed={false} />
          </button>
          {phase === 'shaking' && <p role="status" className="mt-2 font-bold">カラカラ… 正在搖籤</p>}
        </>}
        {phase === 'result' && <>
          <Tube shaking={false} revealed />
          <div className="omikuji-paper mx-auto mt-3 max-w-[14rem] rounded-sm border-2 border-primary bg-card px-4 py-5">
            <p className="text-xs font-bold text-primary">御神籤</p>
            <p className="mt-2 text-3xl font-bold tracking-widest text-primary">{state?.phase==="result"&&state.title}</p>
            {state?.phase === 'result' && (() => { const b = blessingFor(state.title); return <div className="mt-3 border-t border-dashed border-primary/40 pt-3"><p className="text-sm font-bold">{b.ja}</p><p className="mt-1 text-xs">{b.zh}</p></div>; })()}
            <p className="mt-2 text-xs text-muted-foreground">{state && "detail" in state && state.detail}</p>
          </div>
        </>}
        {phase === 'error' && <p className="text-sm text-muted-foreground">{state && "detail" in state && state.detail}</p>}
        {(phase === 'result' || phase === 'error') && <Button className="mt-4 w-full" onClick={onClose}>收下・回到票夾</Button>}
      </div>
    </DialogContent>
  </Dialog>;
}
