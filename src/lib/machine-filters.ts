import type { Machine } from './gacha.functions';
export type MachineFilter = 'all' | 'stock' | 'featured' | 'low' | 'lastone' | 'plenty';
export function filterMachines(machines: Machine[], tag: MachineFilter, query: string) {
  const featured = new Set(machines.filter(m => m.totalStock > 0).slice(0,8).map(m => m.id));
  const q = query.trim().toLowerCase();
  return machines.filter(m => (!q || m.title.toLowerCase().includes(q) || m.items.some(i => i.name.toLowerCase().includes(q))) && (
    tag === 'all' ||
    (tag === 'stock' && m.fulfillmentType !== 'preorder' && m.totalStock > 0) ||
    (tag === 'featured' && featured.has(m.id)) ||
    (tag === 'low' && m.totalStock > 0 && m.totalStock <= 5) ||
    (tag === 'lastone' && !!m.lastOneName && !m.lastOneAwarded && m.totalStock > 0 && m.totalStock <= 10) ||
    (tag === 'plenty' && m.totalStock > 10)
  ));
}
/** Deterministic daily pick among in-stock machines, keyed by Taiwan date (YYYY-MM-DD). */
export function dailyPick(machines: Machine[], day: string) {
  const pool = machines.filter(m => m.totalStock > 0);
  if (!pool.length) return null;
  let h = 0; for (const c of day) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return pool[h % pool.length] ?? null;
}
export const taipeiDay = () => new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10);
