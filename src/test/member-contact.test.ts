import { describe, expect, it } from 'vitest';
import { memberContactSchema, memberEmailSchema, memberCodeSchema } from '@/lib/member-contact';
describe('member contact and verification', () => {
  it('requires name and Taiwan mobile phone for saved shipping contact', () => {
    expect(memberContactSchema.parse({ name: ' 林小貓 ', phone: '0912345678' })).toEqual({ name: '林小貓', phone: '0912345678' });
    expect(memberContactSchema.safeParse({ name: '', phone: '0912345678' }).success).toBe(false);
    expect(memberContactSchema.safeParse({ name: '林小貓', phone: '1234567890' }).success).toBe(false);
  });
  it('uses valid email for identity instead of name or phone', () => {
    expect(memberEmailSchema.parse(' CAT@EXAMPLE.COM ')).toBe('cat@example.com');
    expect(memberEmailSchema.safeParse('0912345678').success).toBe(false);
  });
  it('accepts hosted 6 to 8 digit codes, never arbitrary text', () => {
    expect(memberCodeSchema.safeParse('123456').success).toBe(true);
    expect(memberCodeSchema.safeParse('12345678').success).toBe(true);
    expect(memberCodeSchema.safeParse('12345').success).toBe(false);
    expect(memberCodeSchema.safeParse('abcdef').success).toBe(false);
  });
});