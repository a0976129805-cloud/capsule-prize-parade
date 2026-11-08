export type Rarity = 'SSR' | 'SR' | 'R' | 'N';
export type CatCard = { no: number; page: number; art: number; cat: string; name: string; jp: string; rarity: Rarity; motto: string };

export const CARD_COUNT = 50;
export const PAGE_SIZE = 10;
export const PAGES = [
  { title: '球球の章', zh: '球球' },
  { title: '仙草の章', zh: '仙草' },
  { title: '豆花の章', zh: '豆花' },
  { title: '粉圓の章', zh: '粉圓' },
  { title: '奶油の章', zh: '奶油' },
] as const;

const BASE = [
   { name: '櫻花野餐', jp: '桜のお花見', motto: '今日はのんびり、ゆっくりで。' },
  { name: '春日園丁', jp: '春の庭', motto: 'ふわふわ、しあわせ待ち。' },
  { name: '西瓜假期', jp: '夏のおやつ', motto: 'じっと見守ってるニャ。' },
  { name: '夏祭浴衣', jp: '夏祭り', motto: 'みんなでおやすみ。' },
  { name: '紅葉散步', jp: '紅葉さんぽ', motto: 'なになに？気になる！' },
  { name: '秋日讀書', jp: '読書の秋', motto: 'おなか、見せちゃう。' },
  { name: '初雪圍巾', jp: '初雪', motto: 'まるいは正義。' },
  { name: '暖桌午睡', jp: 'こたつ日和', motto: '今日の見張り番です。' },
  { name: '星月好夢', jp: '星の夢', motto: 'いっしょが一番。' },
  { name: '小小王子', jp: '小さな王子', motto: '頂点の福を、あなたに。' },
] as const;

const RARITY_BY_ART: Rarity[] = ['R', 'N', 'SR', 'N', 'R', 'N', 'R', 'SR', 'N', 'SSR'];
/** Relative drop weight for a single card of each rarity. */
export const RARITY_WEIGHT: Record<Rarity, number> = { N: 12, R: 6, SR: 3, SSR: 1 };

export const CARDS: CatCard[] = Array.from({ length: CARD_COUNT }, (_, i) => {
  const page = Math.floor(i / PAGE_SIZE) + 1; const theme = i % PAGE_SIZE; const b = BASE[theme]; const p = PAGES[page - 1];
  if (!b || !p) throw new Error('Invalid card catalog');
  return { no: i + 1, page, art: i, cat: p.zh, name: `${p.zh}・${b.name}`, jp: b.jp, rarity: RARITY_BY_ART[theme] ?? 'N', motto: b.motto };
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
