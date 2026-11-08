import { afterEach, describe, expect, it, vi } from 'vitest';
import { createGachaAudio } from '@/lib/gacha-audio';

afterEach(() => vi.restoreAllMocks());

function audioHarness() {
  const oscillators: { start: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn> }[] = [];
  const parameter = () => ({ setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() });
  class FakeAudioContext {
    state = 'running'; currentTime = 0; destination = {};
    resume = vi.fn(async () => {}); close = vi.fn(async () => {});
    createOscillator() { const voice = { frequency: parameter(), type: 'sine', connect: vi.fn(), disconnect: vi.fn(), start: vi.fn(), stop: vi.fn(), onended: null }; oscillators.push(voice); return voice; }
    createGain() { return { gain: parameter(), connect: vi.fn(), disconnect: vi.fn() }; }
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
});