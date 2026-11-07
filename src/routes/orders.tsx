import { createFileRoute } from '@tanstack/react-router';
import { Storefront } from './index';
export const Route = createFileRoute('/orders')({
  head: () => ({ meta: [{ title: '訂單進度｜奶油貓 扭蛋屋' }, { name: 'description', content: '查看奶油貓扭蛋訂單與出貨進度，7-11 賣貨便到店付款。' }, { property: 'og:title', content: '訂單進度｜奶油貓' }, { property: 'og:description', content: '核對商品數量與出貨狀態。' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: () => <Storefront initialTab="orders" />,
});
