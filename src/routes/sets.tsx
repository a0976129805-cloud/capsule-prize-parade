import { createFileRoute } from '@tanstack/react-router';
import { Storefront } from './index';
export const Route = createFileRoute('/sets')({
  head: () => ({ meta: [{ title: '整套收藏賣場｜奶油貓 扭蛋屋' }, { name: 'description', content: '日本正版扭蛋每款各一顆，整套收藏，商品滿 NT$1,000 免運，7-11 賣貨便取貨付款。' }, { property: 'og:title', content: '整套收藏賣場｜奶油貓' }, { property: 'og:description', content: '每款各一顆的整套收藏，透過賣貨便寄送。' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: () => <Storefront initialTab="sets" />,
});
