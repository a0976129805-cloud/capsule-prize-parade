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
  const play = (cue: GachaCue, count = 1, lastOne = false) => {
    const ctx = context;
    if (!ctx || ctx.state !== 'running') return;
    const tone = (frequency: number, offset: number, duration: number, gain: number, type: OscillatorType, endFrequency = frequency * .65) => {
      const oscillator = ctx.createOscillator();
      const envelope = ctx.createGain();
      const start = ctx.currentTime + offset;
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, start);
      oscillator.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);
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
      // Bright tuned bells, then a major chord. Celebration never implies rarity.
      const bell = (frequency: number, offset: number, duration = .42) => {
        tone(frequency, offset, duration, .025, 'triangle', frequency);
        tone(frequency * 2, offset, duration * .65, .009, 'sine', frequency * 2);
      };
      [523.25, 659.25, 783.99, 1046.5].forEach((frequency, i) => bell(frequency, i * .105));
      [523.25, 659.25, 783.99].forEach((frequency) => tone(frequency, .46, .75, .018, 'triangle', frequency));
      [1567.98, 2093].forEach((frequency, i) => bell(frequency, .65 + i * .14, .5));
      if (count === 5 || lastOne) {
        [523.25, 659.25, 783.99, 1046.5].forEach((frequency, i) => tone(frequency, 1.02 + i * .09, .23, .016, 'triangle', frequency));
        [523.25, 659.25, 783.99, 1046.5].forEach((frequency) => tone(frequency, 1.46, .65, .012, 'triangle', frequency));
        [2093, 2637, 3136].forEach((frequency, i) => bell(frequency, 1.55 + i * .12, .35));
      }
    }
  };
  return { unlock, play, stop, dispose: () => { stop(); void context?.close().catch(() => {}); context = null; } };
}