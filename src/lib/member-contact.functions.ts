import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { memberContactSchema } from './member-contact';

export const getMemberContact = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data: auth, error: authError } = await context.supabase.auth.getUser();
  if (authError || !auth.user) throw new Error('請重新登入');
  const { data, error } = await context.supabase.from('profiles').select('name,phone').eq('id', context.userId).maybeSingle();
  if (error) throw new Error('會員資料讀取失敗');
  return { name: data?.name ?? '', phone: data?.phone ?? '', email: auth.user.email ?? '' };
});
export const saveMemberContact = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => memberContactSchema.parse(input)).handler(async ({ data, context }) => {
  const { error } = await context.supabase.from('profiles').upsert({ id: context.userId, ...data, updated_at: new Date().toISOString() });
  if (error) throw new Error('會員資料儲存失敗，請再試一次');
  return { ok: true };
});