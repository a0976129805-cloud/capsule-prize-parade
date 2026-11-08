import { GACHA_TIMING } from './gacha-timing';

export type GachaCue = 'coin' | 'turn' | 'drop' | 'open' | 'reveal';

// All synthesis stays local; only a gesture creates/resumes the audio context.
export function createGachaAudio() {
  let context: AudioContext | null = null;
  let output: GainNode | null = null;
  let noiseBuffer: AudioBuffer | null = null;
  let generation = 0;
  const voices = new Set<AudioScheduledSourceNode>();
  const unlock = () => {
    try {
      const Constructor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Constructor) return;
      if (!context) {
        context = new Constructor();
        output = context.createGain();
        output.gain.value = .65;
        const limiter = context.createDynamicsCompressor();
        limiter.threshold.value = -18; limiter.knee.value = 12; limiter.ratio.value = 8;
        limiter.attack.value = .003; limiter.release.value = .15;
        output.connect(limiter); limiter.connect(context.destination);
        noiseBuffer = context.createBuffer(1, Math.ceil(context.sampleRate * .25), context.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      }
      void context.resume().catch(() => {});
    } catch { /* Optional in embedded browsers. */ }
  };
  const stop = () => {
    generation++;
    voices.forEach((voice) => { try { voice.stop(); } catch { /* Already ended. */ } });
    voices.clear();
  };
  const schedule = (cue: GachaCue, count: number, lastOne: boolean) => {
    const ctx = context; const destination = output;
    if (!ctx || !destination || ctx.state !== 'running') return;
    const base = ctx.currentTime + .008;
    const connect = (source: AudioScheduledSourceNode, node: AudioNode, offset: number, duration: number, gain: number, attack = .003) => {
      const envelope = ctx.createGain(); const start = base + offset;
      envelope.gain.setValueAtTime(.0001, start);
      envelope.gain.exponentialRampToValueAtTime(gain, start + attack);
      envelope.gain.exponentialRampToValueAtTime(.0001, start + duration);
      node.connect(envelope); envelope.connect(destination); voices.add(source);
      source.onended = () => { voices.delete(source); source.disconnect(); if (node !== source) node.disconnect(); envelope.disconnect(); };
      source.start(start); source.stop(start + duration + .015);
    };
    const tone = (hz: number, at: number, duration: number, gain: number, type: OscillatorType = 'sine', end = hz, attack = .003) => {
      const voice = ctx.createOscillator(); voice.type = type;
      voice.frequency.setValueAtTime(hz, base + at);
      voice.frequency.exponentialRampToValueAtTime(end, base + at + duration);
      connect(voice, voice, at, duration, gain, attack);
    };
    const texture = (hz: number, at: number, duration: number, gain: number, q = 1) => {
      if (!noiseBuffer) return;
      const voice = ctx.createBufferSource(); voice.buffer = noiseBuffer;
      const filter = ctx.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = hz; filter.Q.value = q;
      voice.connect(filter); connect(voice, filter, at, duration, gain);
    };
    const metal = (at: number, strength = 1) => {
      [1640, 2731, 4210].forEach((hz, i) => tone(hz, at, .22 - i * .04, .034 * strength / (i + 1)));
      texture(3600, at, .022, .05 * strength, 2);
    };
    const bell = (hz: number, at: number, duration = .7) => {
      tone(hz, at, duration, .037, 'sine');
      tone(hz * 2.003, at, duration * .6, .013, 'sine');
      tone(hz * 3, at, duration * .35, .004, 'sine');
    };
    if (cue === 'coin') {
      metal(.035); metal(.14, .65); metal(.29, .4);
      tone(230, .3, .09, .035, 'sine', 90);
    } else if (cue === 'turn') {
      // Uneven filtered impacts and low cavity resonance, not electronic beeps.
      for (let i = 0; i < 16; i++) {
        const at = .035 + i * .089 + (i % 3) * .009;
        texture(i % 2 ? 1800 : 1100, at, .045, .075, 1.4);
        tone(i % 2 ? 170 : 125, at, .05, .04, 'sine', 65);
        texture(650, at + .027, .04, .027);
      }
      texture(420, 1.49, .07, .07);
    } else if (cue === 'drop') {
      for (let i = 0; i < count; i++) {
        const at = i * GACHA_TIMING.capsuleStepMs / 1000 + GACHA_TIMING.landingMs / 1000;
        tone(180, at, .12, .13, 'sine', 58); texture(950, at, .055, .12, 1.3);
        [.19, .32, .4].forEach((bounce, j) => {
          tone(370 + j * 60, at + bounce, .055, .032 / (j + 1), 'sine', 180);
          texture(1500, at + bounce, .035, .045 / (j + 1));
        });
      }
    } else if (cue === 'open') {
      for (let i = 0; i < count; i++) {
        const at = i * GACHA_TIMING.capsuleStepMs / 1000 + .1;
        texture(2200, at, .04, .14, .8);
        tone(650, at, .075, .07, 'sine', 160);
        texture(4500, at + .025, .08, .035);
        bell(1568, at + .07, .45);
      }
    } else {
      // A rhythmic major-key fanfare for every actual result, never a rarity claim.
      [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.5, 1568].forEach((hz, i) => {
        const at = i * .095;
        tone(hz, at, .23, .035, 'triangle', hz, .012); bell(hz * 2, at + .015, .5);
      });
      [523.25, 659.25, 783.99, 1046.5].forEach((hz) => tone(hz, .8, 1.25, .024, 'triangle', hz, .035));
      [2093, 2637, 3136].forEach((hz, i) => bell(hz, 1.04 + i * .12, .9));
      if (count === 5 || lastOne) {
        [783.99, 1046.5, 1318.5, 1568].forEach((hz, i) => { tone(hz, 1.5 + i * .11, .45, .024, 'triangle', hz, .018); bell(hz * 2, 1.55 + i * .11); });
        [523.25, 659.25, 783.99, 1046.5].forEach((hz) => tone(hz, 1.98, 1, .021, 'triangle', hz, .04));
      }
      // Soft cream-cat "nyaa~" signature: rising then falling glide with a nasal overtone.
      const meowAt = count === 5 || lastOne ? 2.7 : 2.05;
      const meow = ctx.createOscillator(); meow.type = 'sawtooth';
      meow.frequency.setValueAtTime(620, base + meowAt);
      meow.frequency.exponentialRampToValueAtTime(980, base + meowAt + .16);
      meow.frequency.exponentialRampToValueAtTime(560, base + meowAt + .55);
      const formant = ctx.createBiquadFilter(); formant.type = 'bandpass'; formant.Q.value = 3;
      formant.frequency.setValueAtTime(1100, base + meowAt); formant.frequency.linearRampToValueAtTime(1800, base + meowAt + .18); formant.frequency.linearRampToValueAtTime(900, base + meowAt + .55);
      meow.connect(formant); connect(meow, formant, meowAt, .6, .09, .06);
    }
  };
  const play = (cue: GachaCue, count = 1, lastOne = false) => {
    const ctx = context; if (!ctx) return;
    if (ctx.state === 'running') schedule(cue, count, lastOne);
    else {
      const current = generation;
      void ctx.resume().then(() => { if (current === generation && context === ctx) schedule(cue, count, lastOne); }).catch(() => {});
    }
  };
  return { unlock, play, stop, dispose: () => { stop(); void context?.close().catch(() => {}); context = null; output = null; noiseBuffer = null; } };
}