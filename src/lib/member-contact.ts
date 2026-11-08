import { z } from 'zod';
export const memberContactSchema = z.object({
  name: z.string().trim().min(1, '請填寫姓名').max(50, '姓名最多 50 字'),
  phone: z.string().trim().regex(/^09\d{8}$/, '請填寫 09 開頭的 10 碼手機號碼'),
});
export const memberEmailSchema = z.string().trim().toLowerCase().email('請填寫有效 Email').max(100);
export const memberCodeSchema = z.string().regex(/^\d{6,8}$/, '請輸入信件中的 6–8 碼驗證碼');