export type GachaCue = 'turn' | 'drop' | 'reveal';

// Created only from a user gesture. No browser APIs run during SSR.
export function createGachaAudio() {
  let context: AudioContext | null = null;
  const voices = new Set<OscillatorNode>();
  const unlock = () => {
    try {
      const Constructor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Constructor) return;
      context ??= new Constructor();
      void context.resume().catch(() => {});
    } catch { /* Sound is optional in embedded browsers. */ }
  };
  const stop = () => {
    voices.forEach((voice) => { try { voice.stop(); } catch { /* Already ended. */ } });
    voices.clear();
  };
  const play = (cue: GachaCue, count = 1) => {
    const ctx = context;
    if (!ctx || ctx.state !== 'running') return;
    const tone = (frequency: number, offset: number, duration: number, gain: number, type: OscillatorType) => {
      const oscillator = ctx.createOscillator();
      const envelope = ctx.createGain();
      const start = ctx.currentTime + offset;
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, start);
      oscillator.frequency.exponentialRampToValueAtTime(frequency * .65, start + duration);
      envelope.gain.setValueAtTime(.001, start);
      envelope.gain.exponentialRampToValueAtTime(gain, start + .006);
      envelope.gain.exponentialRampToValueAtTime(.001, start + duration);
      oscillator.connect(envelope); envelope.connect(ctx.destination);
      voices.add(oscillator);
      oscillator.onended = () => { voices.delete(oscillator); oscillator.disconnect(); envelope.disconnect(); };
      oscillator.start(start); oscillator.stop(start + duration + .02);
    };
    if (cue === 'turn') {
      for (let i = 0; i < 12; i++) tone(i % 2 ? 420 : 280, i * .115, .055, .045, 'triangle');
    } else if (cue === 'drop') {
      for (let i = 0; i < count; i++) { tone(190, i * .18, .1, .09, 'sine'); tone(680, i * .18 + .08, .06, .035, 'triangle'); }
    } else {
      [784, 988, 1175, 1568].forEach((frequency, i) => tone(frequency, i * .09, .48, .035, 'sine'));
    }
  };
  return { unlock, play, stop, dispose: () => { stop(); void context?.close().catch(() => {}); context = null; } };
}