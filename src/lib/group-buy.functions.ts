import { createServerFn } from '@tanstack/react-start';
import { useSession } from '@tanstack/react-start/server';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

export type GroupBuy = { id: string; title: string; image: string; setPrice: number; styleCount: number; eta: string; target: number; status: 'open' | 'success' | 'closed'; sort: number; joined: number };

const db = () => import('@/integrations/supabase/client.server').then(m => m.supabaseAdmin);
async function owner() { const s = await useSession<{ admin?: boolean }>({ password: process.env['SESSION_SECRET']!, name: 'gacha-admin', cookie: { httpOnly: true, secure: true, sameSite: 'none', path: '/' } }); if (!s.data.admin) throw new Error('Forbidden'); }

/** Public list with anonymous join counts only. */
export const listGroupBuys = createServerFn({ method: 'GET' }).handler(async () => {
  const d = await db();
  const [g, j] = await Promise.all([d.from('group_buys').select('*').order('sort').order('created_at', { ascending: false }), d.from('group_buy_joins').select('group_id')]);
  if (g.error) throw new Error('讀取開團失敗');
  const counts = new Map<string, number>();
  for (const r of j.data ?? []) counts.set(r.group_id, (counts.get(r.group_id) ?? 0) + 1);
  return (g.data ?? []).map(r => ({ id: r.id, title: r.title, image: r.image, setPrice: r.set_price, styleCount: r.style_count, eta: r.eta, target: r.target, status: r.status as GroupBuy['status'], sort: r.sort, joined: counts.get(r.id) ?? 0 })) as GroupBuy[];
});

export const myGroupJoins = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data } = await context.supabase.from('group_buy_joins').select('group_id').eq('user_id', context.userId);
  return (data ?? []).map(r => r.group_id);
});

export const toggleGroupJoin = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((d: { groupId: string; join: boolean }) => { if (typeof d.groupId !== 'string') throw new Error('無效'); return { groupId: d.groupId, join: !!d.join }; })
  .handler(async ({ context, data }) => {
    const d = await db();
    const { data: g } = await d.from('group_buys').select('status').eq('id', data.groupId).maybeSingle();
    if (!g || g.status !== 'open') throw new Error('此團目前不開放登記');
    const q = data.join
      ? await d.from('group_buy_joins').upsert({ group_id: data.groupId, user_id: context.userId }, { onConflict: 'group_id,user_id' })
      : await d.from('group_buy_joins').delete().eq('group_id', data.groupId).eq('user_id', context.userId);
    if (q.error) throw new Error('登記失敗');
    return { ok: true };
  });

export const adminSaveGroupBuy = createServerFn({ method: 'POST' })
  .inputValidator((d: Omit<GroupBuy, 'joined'> & { id?: string }) => d)
  .handler(async ({ data }) => {
    await owner();
    const row = { title: String(data.title).trim().slice(0, 120), image: /^\/api\/public\/img\/[\w.-]+$/.test(data.image) ? data.image : '', set_price: Math.max(0, Math.round(+data.setPrice || 0)), style_count: Math.max(1, Math.round(+data.styleCount || 1)), eta: String(data.eta ?? '').slice(0, 40), target: Math.max(1, Math.round(+data.target || 1)), status: ['open', 'success', 'closed'].includes(data.status) ? data.status : 'open', sort: Math.round(+data.sort || 0) };
    if (!row.title) throw new Error('請輸入名稱');
    const d = await db();
    const { error } = data.id ? await d.from('group_buys').update(row).eq('id', data.id) : await d.from('group_buys').insert(row);
    if (error) throw new Error('儲存失敗');
    return { ok: true };
  });

export const adminDeleteGroupBuy = createServerFn({ method: 'POST' }).inputValidator((d: { id: string }) => d).handler(async ({ data }) => {
  await owner();
  const { error } = await (await db()).from('group_buys').delete().eq('id', data.id);
  if (error) throw new Error('刪除失敗');
  return { ok: true };
});
