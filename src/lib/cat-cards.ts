export type Rarity = 'SSR' | 'SR' | 'R' | 'N';
export type CatCard = { no: number; page: number; art: number; name: string; jp: string; rarity: Rarity; motto: string };

export const CARD_COUNT = 50;
export const PAGE_SIZE = 10;
export const PAGES = [
  { title: '桜の章', zh: '櫻花篇' },
  { title: '夏祭りの章', zh: '夏祭篇' },
  { title: '紅葉の章', zh: '紅葉篇' },
  { title: '雪見の章', zh: '雪見篇' },
  { title: '黄金の章', zh: '黃金篇' },
] as const;

const BASE = [
  { name: '慵懶雪鞋', jp: 'ごろごろ', motto: '今日はのんびり、ゆっくりで。' },
  { name: '香箱雪鞋', jp: 'こうばこ', motto: 'ふわふわ、しあわせ待ち。' },
  { name: '端坐黑白', jp: 'おすわり', motto: 'じっと見守ってるニャ。' },
  { name: '三貓午睡', jp: 'おひるね', motto: 'みんなでおやすみ。' },
  { name: '好奇白花', jp: 'きょとん', motto: 'なになに？気になる！' },
  { name: '翻肚黑白', jp: 'へそてん', motto: 'おなか、見せちゃう。' },
  { name: '胖胖坐姿', jp: 'まんまる', motto: 'まるいは正義。' },
  { name: '箱上雪鞋', jp: 'みはりばん', motto: '今日の見張り番です。' },
  { name: '三貓團聚', jp: 'なかよし', motto: 'いっしょが一番。' },
  { name: '奶油貓王', jp: 'ねこのおう', motto: '頂点の福を、あなたに。' },
] as const;

const RARITY_BY_ART: Rarity[] = ['R', 'N', 'SR', 'N', 'R', 'N', 'R', 'SR', 'N', 'SSR'];
/** Relative drop weight for a single card of each rarity. */
export const RARITY_WEIGHT: Record<Rarity, number> = { N: 12, R: 6, SR: 3, SSR: 1 };

export const CARDS: CatCard[] = Array.from({ length: CARD_COUNT }, (_, i) => {
  const page = Math.floor(i / PAGE_SIZE) + 1; const art = i % PAGE_SIZE; const b = BASE[art]!;
  return { no: i + 1, page, art, name: `${b.name}・${PAGES[page - 1]!.zh.replace('篇', '')}`, jp: b.jp, rarity: RARITY_BY_ART[art]!, motto: b.motto };
});

export const cardLabel = (no: number) => `No.${String(no).padStart(2, '0')}`;
export const pageCards = (page: number) => CARDS.filter((c) => c.page === page);

/** Weighted random card numbers; one per capsule. */
export function rollCards(count: number, rand: () => number = Math.random): number[] {
  const total = CARDS.reduce((a, c) => a + RARITY_WEIGHT[c.rarity], 0);
  return Array.from({ length: count }, () => {
    let r = rand() * total;
    for (const c of CARDS) { r -= RARITY_WEIGHT[c.rarity]; if (r < 0) return c.no; }
    return CARDS[CARDS.length - 1]!.no;
  });
}
