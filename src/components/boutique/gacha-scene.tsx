import { Button } from '@/components/ui/button';
import { FastForward } from 'lucide-react';
export function GachaScene({ phase, skipped, onSkip }: { phase: 'spin' | 'drop' | 'open'; skipped: boolean; onSkip: () => void }) {
  return <div role="dialog" aria-modal="true" aria-label="扭蛋進行中" className="bg-overlay fixed inset-0 z-50 flex flex-col items-center justify-center p-4">
    <div className={`gacha-machine ${phase === 'spin' ? 'gm-shake' : ''}`}>
      <div className="gacha-sign">クリームキャット</div>
      <div className="gacha-globe">{Array.from({ length: 12 }, (_, i) => <span key={i} className={`heap-ball heap-${i} ${phase === 'spin' ? 'heap-tumble' : ''}`} />)}<div className="globe-glint" /></div>
      <div className="gacha-body"><div className={`gacha-handle ${phase === 'spin' ? 'gm-handle' : ''}`}><span /></div><div className="gacha-slot" /><span className="gacha-label">ガチャっと、しあわせ。</span></div>
      {phase !== 'spin' && <div className={`gacha-drop ${phase === 'drop' ? 'capsule-roll' : 'capsule-reveal'}`}><div className={`capsule-top ${phase === 'open' ? 'gm-top-open' : ''}`} /><div className={`capsule-bottom ${phase === 'open' ? 'gm-bot-open' : ''}`} />{phase === 'open' && <div className="capsule-sparkles">✦ ✧ ✦</div>}</div>}
    </div>
    <p className="mt-28 text-lg font-bold text-primary-foreground">{skipped ? '正在確認抽獎結果…' : phase === 'spin' ? 'ガチャガチャ…' : phase === 'drop' ? 'コロン！' : 'お楽しみに！'}</p>
    <Button variant="outline" className="mt-4 rounded-full" disabled={skipped} onClick={onSkip}><FastForward />跳過動畫</Button>
  </div>;
}
export function DockIcon({ kind }: { kind: 'home' | 'vault' | 'orders' }) {
  return <span aria-hidden="true" className={`dock-art dock-${kind}`}>{kind === 'home' ? <><i className="dock-globe" /><i className="dock-base"><b /></i></> : kind === 'vault' ? <><i className="dock-box" /><i className="dock-cat">∧ ∧</i></> : <><i className="dock-parcel" /><i className="dock-truck" /><b className="dock-wheel one" /><b className="dock-wheel two" /></>}</span>;
}
