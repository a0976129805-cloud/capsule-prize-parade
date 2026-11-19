import { describe, expect, it } from 'vitest';
import { buildSocialDrafts, canSellSet, itemPreview, titleHashtag } from '@/lib/social-copy';

const machine = {
  id: 'dog/01',
  title: '潦草小狗 第2彈',
  price: 150,
  setPrice: 600,
  items: ['坐姿', '睡覺', '吐舌', '趴趴', '奔跑', '回頭'].map((name) => ({ name, stock: 2 })),
  fulfillmentType: 'stock' as const,
};
const origin = 'https://example.com';
const draft = (id: string, m = machine) => buildSocialDrafts(m, origin).find((d) => d.id === id)!;

describe('social post drafts', () => {
  it('keeps the Threads link out of the main post and puts it in the comment', () => {
    const threads = draft('threads');
    expect(threads.body).not.toContain('https://');
    expect(threads.comment).toBe('線上轉蛋：https://example.com/machines?machine=dog%2F01');
  });

  it('states the stored price, style count and stock type', () => {
    expect(draft('threads').body).toContain('全 6 款｜每抽 NT$150｜台灣現貨');
  });

  it('shows the stored preorder date and never promises a ship date that was not set', () => {
    expect(draft('reply', { ...machine, fulfillmentType: 'preorder', dispatchDate: '2026-12-01' } as never).body).toContain('日本預購・預計 12月1日 出貨');
    expect(draft('reply', { ...machine, fulfillmentType: 'preorder', dispatchDate: null } as never).body).toContain('日本預購・出貨日待確認');
  });

  it('mentions the complete set only when a set price exists and every style is in stock', () => {
    expect(canSellSet(machine)).toBe(true);
    expect(draft('threads').body).toContain('整套 NT$600');
    const soldOut = { ...machine, items: [...machine.items.slice(1), { name: '回頭', stock: 0 }] };
    expect(canSellSet(soldOut)).toBe(false);
    expect(draft('threads', soldOut).body).not.toContain('整套');
    expect(canSellSet({ ...machine, setPrice: 0 })).toBe(false);
  });

  it('lists at most five style names', () => {
    expect(itemPreview(machine)).toBe('坐姿、睡覺、吐舌、趴趴、奔跑 等 6 款');
  });

  it('builds a hashtag from the title without spaces or symbols', () => {
    expect(titleHashtag('潦草小狗 第2彈！')).toBe('#潦草小狗第2彈');
    expect(draft('instagram').body).toContain('#潦草小狗第2彈 #日本扭蛋');
  });

  it('includes the shipping threshold of NT$1,000 in Instagram and reply drafts', () => {
    expect(draft('instagram').body).toContain('滿 NT$1,000 免運');
    expect(draft('reply').body).toContain('滿 NT$1,000 免運');
  });
});
