import { formatDispatchDate } from '@/lib/fulfillment';
import { machineShareUrl } from '@/lib/machine-share';

export type SocialMachine = {
  id: string;
  title: string;
  price: number;
  setPrice?: number;
  items: { name: string; stock: number }[];
  fulfillmentType?: 'stock' | 'preorder';
  dispatchDate?: string | null;
};

export type SocialDraft = { id: 'threads' | 'instagram' | 'reply'; label: string; hint: string; body: string; comment?: string };

const MAX_LISTED_ITEMS = 5;

export function socialFulfillment(machine: SocialMachine) {
  if (machine.fulfillmentType !== 'preorder') return '台灣現貨';
  const date = formatDispatchDate(machine.dispatchDate);
  return date === '待店長確認' ? '日本預購・出貨日待確認' : `日本預購・預計 ${date} 出貨`;
}

export function canSellSet(machine: SocialMachine) {
  return (machine.setPrice ?? 0) > 0 && machine.items.length > 0 && machine.items.every((i) => i.stock > 0);
}

export function itemPreview(machine: SocialMachine) {
  const names = machine.items.map((i) => i.name.trim()).filter(Boolean);
  if (!names.length) return '';
  const listed = names.slice(0, MAX_LISTED_ITEMS).join('、');
  return names.length > MAX_LISTED_ITEMS ? `${listed} 等 ${names.length} 款` : listed;
}

export function titleHashtag(title: string) {
  const tag = title.replace(/[^\p{L}\p{N}]/gu, '');
  return tag ? `#${tag}` : '';
}

/** Ready-to-edit post drafts built only from the machine's stored facts. */
export function buildSocialDrafts(machine: SocialMachine, origin: string): SocialDraft[] {
  const url = machineShareUrl(origin, machine.id);
  const fulfillment = socialFulfillment(machine);
  const items = itemPreview(machine);
  const set = canSellSet(machine) ? `整套 NT$${machine.setPrice}（每款各一顆）` : '';
  const facts = [`全 ${machine.items.length} 款`, `每抽 NT$${machine.price}`, fulfillment].join('｜');
  const tags = [titleHashtag(machine.title), '#日本扭蛋', '#扭蛋', '#ガチャガチャ'].filter(Boolean).join(' ');

  return [
    {
      id: 'threads',
      label: 'Threads 短文',
      hint: '主文不放連結，連結貼在自己的第一則留言。',
      body: [machine.title, facts, set, '想要哪一隻？連結放留言'].filter(Boolean).join('\n'),
      comment: `線上轉蛋：${url}`,
    },
    {
      id: 'instagram',
      label: 'IG 貼文',
      hint: 'IG 貼文連結不能點，請客人到主頁或私訊。',
      body: [
        `【日本正版扭蛋】${machine.title}`,
        facts,
        items && `款式：${items}`,
        set,
        '保留原廠內袋與蛋紙，7-11 取貨付款，商品滿 NT$1,000 免運。',
        '線上轉蛋連結在主頁，或直接私訊我',
      ].filter(Boolean).join('\n') + `\n\n${tags}`,
    },
    {
      id: 'reply',
      label: '社團／私訊回覆',
      hint: '有人留言或私訊詢問時，直接貼給對方。',
      body: [
        `${machine.title}：${facts}`,
        set,
        '7-11 取貨付款，商品滿 NT$1,000 免運。',
        `可以直接線上轉：${url}`,
      ].filter(Boolean).join('\n'),
    },
  ];
}
