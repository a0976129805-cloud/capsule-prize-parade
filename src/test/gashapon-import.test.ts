import { describe, expect, it } from 'vitest';
import { gashaponProductUrl, isBandaiImage, parseGashaponHtml } from '@/lib/gashapon-import';

const IMG = 'https://bandai-a.akamaihd.net/bc/img/model/xl/1000258025';
const html = `
<meta property="og:title" content="RIIZE つまんでつなげてますこっと &amp; でらっくす!">
<meta property="og:image" content="${IMG}_1.jpg">
<dl class="pg-detailDefinition"><dt class="t">発売時期</dt><dd class="d --releaseDate">
  2027年2月未定<br />
</dd></dl>
<dl><dt>
  価格(税込)  </dt><dd>1,000円</dd></dl>
<dl><dt>種類数</dt><dd>全12種</dd></dl>
<img src="${IMG}_1.jpg" title="" alt="">
<img loading="lazy" src="${IMG}_2.jpg" title="SHOTARO（ボールチェーンver.）" alt="">
<img loading="lazy" src="${IMG}_3.jpg" title="WONBIN （カニカンver.）" alt="">
<img loading="lazy" src="${IMG}_2.jpg" title="SHOTARO（ボールチェーンver.）" alt="">
<img src="https://bandai-a.akamaihd.net/bc/img/model/b/1000227905_1.jpg" title="おすすめ">
`;

describe('Bandai gashapon import', () => {
  it('accepts only official gashapon.jp product pages and normalizes the URL', () => {
    expect(gashaponProductUrl('https://gashapon.jp/products/detail.php?jan_code=4570118186362000&x=1')).toBe('https://gashapon.jp/products/detail.php?jan_code=4570118186362000');
    expect(gashaponProductUrl('http://gashapon.jp/products/detail.php?jan_code=4570118186362000')).toBeNull();
    expect(gashaponProductUrl('https://evil.example/products/detail.php?jan_code=4570118186362000')).toBeNull();
    expect(gashaponProductUrl('https://gashapon.jp/products/detail.php?jan_code=abc')).toBeNull();
  });

  it('reads title, cover, yen price, style count and release month', () => {
    const d = parseGashaponHtml(html, 'src');
    expect(d.title).toBe('RIIZE つまんでつなげてますこっと & でらっくす!');
    expect(d.cover).toBe(`${IMG}_1.jpg`);
    expect(d.yenPrice).toBe(1000);
    expect(d.styleCount).toBe(12);
    expect(d.release).toBe('2027年2月未定');
  });

  it('lists each style once with its own photo, skipping the cover and other products', () => {
    expect(parseGashaponHtml(html, 'src').items).toEqual([
      { name: 'SHOTARO（ボールチェーンver.）', image: `${IMG}_2.jpg` },
      { name: 'WONBIN （カニカンver.）', image: `${IMG}_3.jpg` },
    ]);
  });

  it('fills placeholder styles from the official style count when the page has no per-style photos', () => {
    const group = html.replace(/<img loading[^>]*>/g, '');
    const d = parseGashaponHtml(group, 'src');
    expect(d.stylesFromPage).toBe(false);
    expect(d.items).toHaveLength(12);
    expect(d.items[0]).toEqual({ name: '款式 1', image: `${IMG}_1.jpg` });
  });

  it('rejects pages without product data', () => {
    expect(() => parseGashaponHtml('<html></html>', 'src')).toThrow();
  });

  it('only copies photos from the Bandai image server', () => {
    expect(isBandaiImage(`${IMG}_2.jpg`)).toBe(true);
    expect(isBandaiImage('https://example.com/a.jpg')).toBe(false);
  });
});
