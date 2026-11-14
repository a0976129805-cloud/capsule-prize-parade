import { z } from 'zod';

export const promoCodeSchema = z.object({
  code: z.string().trim().min(2, '代碼至少 2 碼').max(32, '代碼最多 32 碼')
    .regex(/^[A-Za-z0-9][A-Za-z0-9_-]+$/, '代碼限英文、數字、-、_')
    .transform((value) => value.toUpperCase()),
  name: z.string().trim().min(1, '請輸入券名').max(60, '券名最多 60 字'),
  amount: z.number().int().min(0).max(10000),
  minimum: z.number().int().min(0).max(1000000),
  days: z.number().int().min(1, '有效天數至少 1 天').max(90, '有效天數最多 90 天'),
  enabled: z.boolean(),
}).superRefine((value, context) => {
  if (value.amount <= 0) context.addIssue({ code: 'custom', path: ['amount'], message: '折扣需大於 0' });
  if (value.minimum < value.amount) context.addIssue({ code: 'custom', path: ['minimum'], message: '最低消費門檻不能低於折扣' });
});

export type PromoCodeInput = z.infer<typeof promoCodeSchema>;
export type PromoCode = PromoCodeInput & { id: string; created_at: string; claims: number };
export type RedeemedPromo = { code: string; name: string; amount: number; minimum: number; expires_at: string };

export const redeemedPromoSchema = z.object({
  code: z.string(),
  name: z.string(),
  amount: z.number().int(),
  minimum: z.number().int(),
  expires_at: z.string(),
});

/** A new code is always presented as opt-in; no discount is activated automatically. */
export const emptyPromoCode: PromoCodeInput = {
  code: '', name: '', amount: 0, minimum: 0, days: 7, enabled: false,
};
