import { createServerFn } from '@tanstack/react-start';
import { setResponseHeader, useSession } from '@tanstack/react-start/server';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { promoCodeSchema, redeemedPromoSchema } from './promo-codes';

async function owner() {
  const session = await useSession<{ admin?: boolean }>({
    password: process.env['SESSION_SECRET']!, name: 'gacha-admin',
    cookie: { httpOnly: true, secure: true, sameSite: 'none', path: '/' },
  });
  if (!session.data.admin) throw new Error('Forbidden');
}

export const adminPromoCodes = createServerFn({ method: 'GET' }).handler(async () => {
  await owner();
  setResponseHeader('Cache-Control', 'no-store');
  const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
  const [codes, redemptions] = await Promise.all([
    db.from('promo_codes').select('id,code,name,amount,minimum,days,enabled,created_at').order('created_at', { ascending: false }),
    db.from('promo_redemptions').select('code_id'),
  ]);
  if (codes.error || redemptions.error) throw new Error('讀取代碼失敗');
  const counts = new Map<string, number>();
  for (const row of redemptions.data ?? []) counts.set(row.code_id, (counts.get(row.code_id) ?? 0) + 1);
  return (codes.data ?? []).map((code) => ({ ...code, claims: counts.get(code.id) ?? 0 }));
});

export const adminCreatePromoCode = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => promoCodeSchema.parse(data))
  .handler(async ({ data }) => {
    await owner();
    const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
    const { error } = await db.from('promo_codes').insert(data);
    if (error) throw new Error(error.code === '23505' ? '這組代碼已存在' : '建立代碼失敗，請確認欄位');
    return { ok: true, code: data.code };
  });

export const adminSetPromoCode = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid(), enabled: z.boolean() }).parse(data))
  .handler(async ({ data }) => {
    await owner();
    const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
    const { error } = await db.from('promo_codes').update({ enabled: data.enabled }).eq('id', data.id);
    if (error) throw new Error('更新代碼失敗');
    return { ok: true };
  });

export const adminDeletePromoCode = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    await owner();
    const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
    const { error } = await db.rpc('delete_promo_code', { _id: data.id });
    if (error) throw new Error(error.message.includes('已有會員領取') ? '已有會員領取，請改用停用' : '刪除代碼失敗');
    return { ok: true };
  });

export const redeemPromoCode = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ code: z.string().trim().min(2).max(32) }).parse(data))
  .handler(async ({ data, context }) => {
    setResponseHeader('Cache-Control', 'no-store');
    const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
    const { data: result, error } = await db.rpc('redeem_promo_code', { _user: context.userId, _code: data.code });
    if (error) {
      const allowed = ['代碼不存在或已停用', '這組代碼已領取過', '代碼設定不完整，請聯繫店長', '請先登入會員'];
      throw new Error(allowed.includes(error.message) ? error.message : '兌換失敗，請稍後再試');
    }
    return redeemedPromoSchema.parse(result);
  });
