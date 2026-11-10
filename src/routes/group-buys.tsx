import { createFileRoute } from '@tanstack/react-router';
import { Storefront } from './index';
export const Route = createFileRoute('/group-buys')({
  head: () => ({ meta: [{ title: '預購開團｜奶油貓 扭蛋屋' }, { name: 'description', content: '店長精選日本扭蛋整套預購，達目標組數即成團。' }, { property: 'og:title', content: '預購開團｜奶油貓' }, { property: 'og:description', content: '整套預購，集滿組數就成團。' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: () => <Storefront initialTab="groups" />,
});
