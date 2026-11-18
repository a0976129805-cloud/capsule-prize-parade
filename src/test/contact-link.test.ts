import { describe, expect, it } from 'vitest';
import { storeContact } from '@/lib/contact-link';

describe('store contact shortcut', () => {
  it('uses Instagram first when the owner has configured several channels', () => {
    expect(storeContact({ igUrl: 'https://instagram.com/creamcat', lineUrl: 'https://line.me/example', contactEmail: 'owner@example.com' })).toEqual({
      href: 'https://ig.me/m/creamcat',
      channel: 'Instagram',
      label: '私訊店長 IG',
    });
  });

  it('falls back to LINE and then Email without inventing a contact channel', () => {
    expect(storeContact({ lineUrl: 'https://line.me/example', contactEmail: 'owner@example.com' })?.channel).toBe('LINE');
    expect(storeContact({ contactEmail: 'owner@example.com' })?.href).toBe('mailto:owner@example.com');
    expect(storeContact({ igUrl: ' ', lineUrl: '', contactEmail: '' })).toBeNull();
  });
});
