import { Button } from '@/components/ui/button';
import { FastForward, Volume2, VolumeX } from 'lucide-react';
export function GachaScene({ phase, skipped, onSkip, count = 1, sound, onSound }: { phase: 'coin' | 'spin' | 'drop' | 'open'; skipped: boolean; onSkip: () => void; count?: number; sound: boolean; onSound: () => void }) {
  return <div role="dialog" aria-modal="true" aria-label="扭蛋進行中" className="bg-overlay fixed inset-0 z-50 flex flex-col items-center justify-center p-4">
    <Button variant="secondary" size="icon" aria-label={sound ? '關閉扭蛋音效' : '開啟扭蛋音效'} onClick={onSound} className="absolute right-4 top-4 rounded-full">{sound ? <Volume2 /> : <VolumeX />}</Button>
    <p className="mb-5 text-xs font-bold text-primary-foreground">クリームキャット · {count === 5 ? '5 連ガチャ' : '1 回ガチャ'}</p>
    <div className={`gacha-machine ${phase === 'spin' ? 'gm-shake' : ''}`}>
      <div className="gacha-sign">クリームキャット</div>
      <div className="gacha-globe">{Array.from({ length: 12 }, (_, i) => <span key={i} className={`heap-ball heap-${i} ${phase === 'spin' ? 'heap-tumble' : ''}`} />)}<div className="globe-glint" /></div>
      <div className="gacha-body"><div className="gacha-coin-slot" />{phase === 'coin' && <span aria-hidden="true" className="gacha-coin">¥</span>}<div className={`gacha-handle ${phase === 'spin' ? 'gm-handle' : ''}`}><span /></div><div className={`gacha-slot ${phase === 'drop' ? 'gacha-slot-active' : ''}`} /><span className="gacha-label">ガチャっと、しあわせ。</span></div>
    </div>
    <div className={`capsule-stage ${count === 5 ? 'capsule-stage-five' : ''}`} aria-hidden="true">{(phase === 'drop' || phase === 'open') && Array.from({ length: count }, (_, i) => <div key={`${phase}-${i}`} className={`stage-capsule stage-capsule-${i} ${phase === 'drop' ? 'stage-roll' : 'stage-open'}`}><div className="capsule-top" /><div className="capsule-bottom" />{phase === 'open' && <><span className="capsule-sparkles">✦ ✧</span><span className="reveal-rays" /><span className="reveal-star">✦</span>{Array.from({ length: 10 }, (_, j) => <i key={j} className={`reveal-confetti confetti-${j}`} />)}</>}</div>)}</div>
    <p aria-live="polite" className="mt-2 text-lg font-bold text-primary-foreground">{skipped ? '正在確認抽獎結果…' : phase === 'coin' ? 'チャリン♪' : phase === 'spin' ? 'ガチャガチャ…' : phase === 'drop' ? 'コロン！' : '小さな幸せ、ひらけ！'}</p>
    <Button variant="outline" className="mt-4 rounded-full" disabled={skipped} onClick={onSkip}><FastForward />跳過動畫</Button>
  </div>;
}
export function DockIcon({ kind }: { kind: 'home' | 'sets' | 'vault' | 'orders' }) {
  if (kind === 'sets') return <span aria-hidden="true" className="dock-art dock-sets"><i className="dock-set-bag" /><i className="dock-set-capsule" /><b className="dock-set-star">✦</b></span>;
  return <span aria-hidden="true" className={`dock-art dock-${kind}`}>{kind === 'home' ? <><i className="dock-globe" /><i className="dock-base"><b /></i></> : kind === 'vault' ? <><i className="dock-box" /><i className="dock-cat">∧ ∧</i></> : <><i className="dock-parcel" /><i className="dock-truck" /><b className="dock-wheel one" /><b className="dock-wheel two" /></>}</span>;
}
