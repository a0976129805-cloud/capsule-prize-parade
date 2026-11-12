import type { Machine, Order } from './gacha.functions';

export function salesSummary(orders: Order[], machines: Machine[], status = 'active') {
  const valid = orders.filter(o => o.status !== '已取消' && (status !== 'collected' || o.status === '已取貨'));
  const rows = new Map<string, { key: string; title: string; count: number; amount: number; stock: number | null; prizes: Map<string, { name: string; count: number }> }>();
  let gifts = 0;
  for (const order of valid) for (const item of order.items) {
    if (item.isLastOne) { gifts++; continue; }
    const machine = machines.find(m => m.items.some(p => p.id === item.id));
    const key = machine?.id ?? item.machineTitle;
    let row = rows.get(key);
    if (!row) { row = { key, title: machine?.title ?? item.machineTitle, count: 0, amount: 0, stock: machine?.totalStock ?? null, prizes: new Map() }; rows.set(key, row); }
    row.count++; row.amount += item.price;
    const prize = row.prizes.get(item.id) ?? { name: item.name, count: 0 };
    prize.count++; row.prizes.set(item.id, prize);
  }
  const ranked = [...rows.values()].map(r => ({ ...r, prizes: [...r.prizes.values()].sort((a,b) => b.count-a.count) })).sort((a,b) => b.amount-a.amount || b.count-a.count);
  const gross = ranked.reduce((s,r) => s+r.amount, 0);
  const discount = valid.reduce((s,o) => s+(o.discount ?? 0), 0);
  return { rows: ranked, orders: valid.length, count: ranked.reduce((s,r) => s+r.count, 0), gross, discount, net: gross-discount, gifts };
}