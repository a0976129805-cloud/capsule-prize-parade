/** Parses an official Bandai gashapon.jp product page into a machine draft. Browser- and worker-safe (no DOM). */
export type GashaponDraft = {
  title: string;
  cover: string;
  items: { name: string; image: string }[];
  yenPrice: number | null;
  styleCount: number | null;
  release: string;
  sourceUrl: string;
  /** False when the page has no per-style photos and styles were filled with the cover as placeholders. */
  stylesFromPage: boolean;
};

const IMAGE_HOST = 'https://bandai-a.akamaihd.net/';

export function gashaponProductUrl(input: string) {
  let url: URL;
  try { url = new URL(input.trim()); } catch { return null; }
  if (url.protocol !== 'https:' || url.hostname !== 'gashapon.jp' || url.pathname !== '/products/detail.php') return null;
  const jan = url.searchParams.get('jan_code') ?? '';
  return /^\d{8,20}$/.test(jan) ? `https://gashapon.jp/products/detail.php?jan_code=${jan}` : null;
}

const decode = (s: string) => s
  .replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '')
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&quot;/g, '"').replace(/&#039;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ').trim();

const meta = (html: string, prop: string) => {
  const m = html.match(new RegExp(`<meta[^>]+property=["']og:${prop}["'][^>]+content=["']([^"']*)["']`, 'i'));
  return m ? decode(m[1] ?? '') : '';
};

function details(html: string) {
  const out = new Map<string, string>();
  for (const m of html.matchAll(/<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/gi)) out.set(decode(m[1] ?? ''), decode(m[2] ?? ''));
  return out;
}

export function parseGashaponHtml(html: string, sourceUrl: string): GashaponDraft {
  const title = meta(html, 'title').replace(/｜ガシャポンオフィシャルサイト$/, '');
  const cover = meta(html, 'image');
  if (!title || !cover.startsWith(IMAGE_HOST)) throw new Error('找不到商品資料，請確認是萬代 gashapon.jp 的商品頁');
  const model = cover.match(/\/(\d+)_1\.(?:jpg|png)$/)?.[1];
  let items: GashaponDraft['items'] = [];
  const seen = new Set<string>();
  let named = 0;
  if (model) {
    const re = new RegExp(`<img[^>]+src=["'](${IMAGE_HOST.replace(/[.]/g, '\\.')}bc/img/model/xl/${model}_(\\d+)\\.(?:jpg|png))["'][^>]*>`, 'gi');
    for (const m of html.matchAll(re)) {
      const src = m[1] ?? '';
      if (!src || m[2] === '1' || seen.has(src)) continue;
      seen.add(src);
      const name = decode(m[0].match(/title=["']([^"']*)["']/i)?.[1] ?? '');
      if (name) named++;
      items.push({ name: name || `款式 ${items.length + 1}`, image: src });
    }
  }
  const d = details(html);
  const yen = (d.get('価格(税込)') ?? '').replace(/[,，]/g, '').match(/(\d+)\s*円/);
  const count = (d.get('種類数') ?? '').match(/(\d+)/);
  const styleCount = count ? Number(count[1]) : null;
  const stylesFromPage = named > 0;
  if (!stylesFromPage) items = Array.from({ length: Math.min(styleCount ?? 1, 60) }, (_, i) => ({ name: `款式 ${i + 1}`, image: cover }));
  return {
    title, cover, items, stylesFromPage,
    yenPrice: yen ? Number(yen[1]) : null,
    styleCount,
    release: d.get('発売時期') ?? '',
    sourceUrl,
  };
}

export function isBandaiImage(url: string) {
  return url.startsWith(`${IMAGE_HOST}bc/img/model/`) && /\.(?:jpg|png)$/.test(url);
}
