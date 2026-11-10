import { createFileRoute } from '@tanstack/react-router';
import { Storefront } from './index';
export const Route = createFileRoute('/machines')({
  head: () => ({ meta: [{ title: '全部扭蛋機｜奶油貓 扭蛋屋' }, { name: 'description', content: '瀏覽全部日本正版扭蛋機台，可搜尋與分類，7-11 賣貨便取貨付款。' }, { property: 'og:title', content: '全部扭蛋機｜奶油貓' }, { property: 'og:description', content: '日本正版扭蛋機台一覽。' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: () => <Storefront initialTab="machines" />,
});
