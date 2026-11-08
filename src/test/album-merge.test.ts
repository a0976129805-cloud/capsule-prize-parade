import { expect, it } from 'vitest';
import { validateAlbumMerge } from '@/lib/album-merge';

it('requires explicit confirmation before moving guest cards into a member album', () => {
  expect(() => validateAlbumMerge({ deviceId: 'guest-phone', confirmed: false })).toThrow();
  expect(validateAlbumMerge({ deviceId: 'guest-phone', confirmed: true })).toEqual({ deviceId: 'guest-phone' });
});