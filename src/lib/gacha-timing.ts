// Shared by audio, CSS sequence variables and the browser animation controller.
export const GACHA_TIMING = {
  coinMs: 480,
  turnMs: 1600,
  capsuleStepMs: 180,
  landingMs: 360,
  dropMs: 950,
  openMs: 1100,
} as const;

export function gachaDropDuration(count: number) {
  return GACHA_TIMING.dropMs + (count - 1) * GACHA_TIMING.capsuleStepMs;
}