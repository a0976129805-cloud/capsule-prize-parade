import type { Machine } from './gacha.functions';
export type MachineFilter = 'all' | 'stock' | 'featured' | 'low' | 'lastone' | 'plenty';
export function filterMachines(machines: Machine[], tag: MachineFilter, query: string) {
  const featured = new Set(machines.filter(m => m.totalStock > 0).slice(0,8).map(m => m.id));
  return machines.filter(m => m.title.toLowerCase().includes(query.trim().toLowerCase()) && (
    tag === 'all' ||
    (tag === 'stock' && m.fulfillmentType !== 'preorder' && m.totalStock > 0) ||
    (tag === 'featured' && featured.has(m.id)) ||
    (tag === 'low' && m.totalStock > 0 && m.totalStock <= 5) ||
    (tag === 'lastone' && !!m.lastOneName && !m.lastOneAwarded && m.totalStock > 0 && m.totalStock <= 10) ||
    (tag === 'plenty' && m.totalStock > 10)
  ));
}