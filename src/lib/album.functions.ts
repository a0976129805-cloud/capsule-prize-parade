import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { ALBUM_DEFAULT, rewardSettingsSchema } from './rewards';
import { validateAlbumMerge } from './album-merge';

const dev = (d: unknown) => String(d ?? '').slice(0, 80);

export const memberAlbum = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { deviceId: string }) => ({ deviceId: dev(d.deviceId) }))
  .handler(async ({ context, data }) => {
    const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
    const [cards, claims, guest, link, cfg] = await Promise.all([
      context.supabase.from('member_cat_cards').select('card_no,copies').eq('user_id', context.userId),
      context.supabase.from('member_album_claims').select('page').eq('user_id', context.userId),
      db.from('cat_cards').select('card_no,copies').eq('device_id', data.deviceId),
      db.from('album_device_links').select('user_id').eq('device_id', data.deviceId).maybeSingle(),
      db.from('reward_settings').select('data').eq('id', 1).maybeSingle(),
    ]);
    if (cards.error || claims.error || guest.error || link.error) throw new Error('讀取卡冊失敗');
    const parsed = rewardSettingsSchema.safeParse(cfg.data?.data);
    const reward = parsed.success ? parsed.data.album : ALBUM_DEFAULT;
    return {
      cards: (cards.data ?? []).map(r => ({ no: r.card_no, copies: r.copies })),
      claimed: (claims.data ?? []).map(r => r.page),
      reward: { enabled: reward.enabled && reward.amount > 0, amount: reward.amount, minimum: reward.minimum },
      guestCount: (guest.data ?? []).reduce((sum, r) => sum + r.copies, 0),
      mergeBlocked: !!link.data && link.data.user_id !== context.userId,
    };
  });

export const mergeAlbum = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(validateAlbumMerge)
  .handler(async ({ context, data }) => {
    const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
    const { error } = await db.rpc('merge_cat_album', { _user: context.userId, _device: data.deviceId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const myAlbum = createServerFn({ method: 'POST' })
  .inputValidator((d: { deviceId: string }) => ({ deviceId: dev(d.deviceId) }))
  .handler(async ({ data }) => {
    const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
    const [c, k, cfg] = await Promise.all([
      db.from('cat_cards').select('card_no,copies').eq('device_id', data.deviceId),
      db.from('album_claims').select('page').eq('device_id', data.deviceId),
      db.from('reward_settings').select('data').eq('id', 1).maybeSingle(),
    ]);
    if (c.error || k.error) throw new Error('讀取卡冊失敗');
    const parsed = rewardSettingsSchema.safeParse(cfg.data?.data);
    const album = parsed.success ? parsed.data.album : ALBUM_DEFAULT;
    return {
      cards: (c.data ?? []).map((r) => ({ no: r.card_no, copies: r.copies })),
      claimed: (k.data ?? []).map((r) => r.page),
      reward: { enabled: album.enabled && album.amount > 0, amount: album.amount, minimum: album.minimum },
    };
  });

export const claimAlbumPage = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { deviceId: string; page: number }) => {
    const page = Number(d.page);
    if (!Number.isInteger(page) || page < 1 || page > 5) throw new Error('無效頁數');
    return { deviceId: dev(d.deviceId), page };
  })
  .handler(async ({ context, data }) => {
    const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
    const { data: r, error } = await db.rpc('claim_album_page', { _user: context.userId, _device: data.deviceId, _page: data.page });
    if (error) throw new Error(error.message);
    return r as { page: number; amount: number; minimum: number };
  });
