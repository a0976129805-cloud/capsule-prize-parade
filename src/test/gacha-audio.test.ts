import { afterEach, describe, expect, it, vi } from 'vitest';
import { createGachaAudio } from '@/lib/gacha-audio';

afterEach(() => vi.restoreAllMocks());

function audioHarness() {
  const oscillators: { start: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn> }[] = [];
  const parameter = () => ({ setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() });
  class FakeAudioContext {
    state = 'running'; currentTime = 0; destination = {}; sampleRate = 44100;
    resume = vi.fn(async () => {}); close = vi.fn(async () => {});
    createOscillator() { const voice = { frequency: parameter(), type: 'sine', connect: vi.fn(), disconnect: vi.fn(), start: vi.fn(), stop: vi.fn(), onended: null }; oscillators.push(voice); return voice; }
    createGain() { return { gain: parameter(), connect: vi.fn(), disconnect: vi.fn() }; }
    createBuffer(_channels: number, size: number) { return { getChannelData: () => new Float32Array(size) }; }
    createBufferSource() { return this.createOscillator(); }
    createBiquadFilter() { return { frequency: {}, Q: {}, connect: vi.fn(), disconnect: vi.fn() }; }
    createDynamicsCompressor() { return { threshold: {}, knee: {}, ratio: {}, attack: {}, release: {}, connect: vi.fn() }; }
  }
  vi.stubGlobal('AudioContext', FakeAudioContext);
  return oscillators;
}

describe('gesture-initialized celebration audio', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('does not create sound before unlock and stops every scheduled voice', () => {
    const voices = audioHarness(); const audio = createGachaAudio();
    audio.play('reveal'); expect(voices).toHaveLength(0);
    audio.unlock(); audio.play('reveal'); expect(voices.length).toBeGreaterThan(0);
    audio.stop(); expect(voices.every((voice) => voice.stop.mock.calls.length === 2)).toBe(true);
  });
  it('extends celebration for five draws and for a real last-one award', () => {
    const voices = audioHarness(); const audio = createGachaAudio(); audio.unlock();
    audio.play('reveal', 1); const normal = voices.length;
    audio.stop(); audio.play('reveal', 5); const five = voices.length - normal;
    audio.stop(); audio.play('reveal', 1, true); const lastOne = voices.length - normal - five;
    expect(five).toBeGreaterThan(normal); expect(lastOne).toBe(five);
    audio.dispose();
  });
  it('provides separate coin, ratchet, landing and opening textures that can all be cancelled', () => {
    const voices = audioHarness(); const audio = createGachaAudio(); audio.unlock();
    for (const cue of ['coin', 'turn', 'drop', 'open'] as const) {
      const before = voices.length; audio.play(cue, 5);
      expect(voices.length).toBeGreaterThan(before);
      audio.stop();
      expect(voices.slice(before).every((voice) => voice.stop.mock.calls.length === 2)).toBe(true);
    }
  });
  it('times five landing impacts to each visible capsule rather than the start of the fall', () => {
    const voices = audioHarness(); const audio = createGachaAudio(); audio.unlock(); audio.play('drop', 5);
    const starts = voices.map((v) => v.start.mock.calls[0]?.[0]);
    expect(Math.min(...starts)).toBeCloseTo(.368);
    for (let i = 0; i < 5; i++) expect(starts.some((time) => Math.abs(time - (.368 + i * .18)) < .001)).toBe(true);
  });
});