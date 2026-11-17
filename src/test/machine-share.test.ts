import { describe, expect, it } from 'vitest';
import { machineShareText, machineShareUrl } from '@/lib/machine-share';

const machine = {
  id: 'dog/01',
  title: '潦草小狗',
  price: 150,
  items: [{}, {}, {}],
  fulfillmentType: 'stock' as const,
};

describe('machine sharing', () => {
  it('builds a direct machine URL and escapes the machine id', () => {
    expect(machineShareUrl('https://example.com/', machine.id)).toBe('https://example.com/machines?machine=dog%2F01');
  });

  it('copies only actual product facts, price and shop fulfillment terms', () => {
    expect(machineShareText(machine, 'https://example.com')).toBe([
      '【日本正版扭蛋】潦草小狗',
      '全 3 種・每抽 NT$150・台灣現貨',
      '保留原廠內袋與蛋紙，7-11 取貨付款，商品滿 NT$1,000 免運。',
      '機台直達：https://example.com/machines?machine=dog%2F01',
    ].join('\n'));
  });

  it('includes the stored preorder date instead of promising immediate shipping', () => {
    const text = machineShareText({ ...machine, fulfillmentType: 'preorder', dispatchDate: '2026-12-01' }, 'https://example.com');
    expect(text).toContain('日本預購・預計 2026-12-01 回台後出貨');
  });
});
