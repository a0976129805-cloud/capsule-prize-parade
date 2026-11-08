import { describe, it, expect } from 'vitest';
import { sessionEventAction } from '@/lib/member-restoration';
describe('password-free returning membership',()=>{
  it('restores the previous member on reopening without refetch storms',()=>{
    expect(sessionEventAction('INITIAL_SESSION')).toEqual({restore:true,invalidate:false});
  });
  it('keeps refreshed sessions without asking for email again',()=>{
    expect(sessionEventAction('TOKEN_REFRESHED')).toEqual({restore:true,invalidate:false});
  });
  it('clears the identity on explicit sign out',()=>{
    expect(sessionEventAction('SIGNED_OUT')).toEqual({restore:true,invalidate:true});
  });
});