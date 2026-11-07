import { createFileRoute } from '@tanstack/react-router';
import { Storefront } from './index';
export const Route = createFileRoute('/vault')({
  head: () => ({ meta: [{ title: '我的倉庫｜奶油貓 扭蛋屋' }, { name: 'description', content: '查看扭蛋收藏與 24 小時保留倒數，所有倉庫商品合併出貨，滿千免運。' }, { property: 'og:title', content: '我的倉庫｜奶油貓' }, { property: 'og:description', content: '24 小時暫存與整倉出貨。' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: () => <Storefront initialTab="vault" />,
});
