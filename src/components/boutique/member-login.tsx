import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { getMemberContact, saveMemberContact } from '@/lib/member-contact.functions';
import { memberContactSchema, memberEmailSchema, memberCodeSchema } from '@/lib/member-contact';
import { useMember } from './member-session';
import catLogo from '@/assets/cat-logo.png';

export function MemberLogin() {
 const {userId,ready}=useMember(); const navigate=useNavigate(); const cache=useQueryClient();
 const readContact=useServerFn(getMemberContact); const saveContact=useServerFn(saveMemberContact);
 const contact=useQuery({queryKey:['member-contact',userId],queryFn:()=>readContact(),enabled:ready&&!!userId});
 const [name,setName]=useState(''); const [phone,setPhone]=useState(''); const [email,setEmail]=useState(''); const [code,setCode]=useState('');
 const [stage,setStage]=useState<'email'|'code'>('email'); const [busy,setBusy]=useState(false); const [error,setError]=useState(''); const [cooldown,setCooldown]=useState(0);
 useEffect(()=>{if(contact.data){setName(contact.data.name);setPhone(contact.data.phone);setEmail(contact.data.email);}},[contact.data]);
 useEffect(()=>{if(cooldown<=0)return;const timer=setTimeout(()=>setCooldown(n=>n-1),1000);return()=>clearTimeout(timer);},[cooldown]);
 const send=async()=>{setBusy(true);setError('');try{const address=memberEmailSchema.parse(email);setEmail(address);const {error:e}=await supabase.auth.signInWithOtp({email:address,options:{shouldCreateUser:true,emailRedirectTo:window.location.origin+'/auth'}});if(e)throw new Error(e.status===429?'寄送太頻繁，請稍後再試。':'驗證信寄送失敗，請稍後再試。');setStage('code');setCooldown(60);}catch(e){setError(e instanceof Error?e.message:'請確認 Email');}finally{setBusy(false);}};
 const verify=async()=>{setBusy(true);setError('');try{const token=memberCodeSchema.parse(code);const {error:e}=await supabase.auth.verifyOtp({email:memberEmailSchema.parse(email),token,type:'email'});if(e)throw new Error('驗證碼不正確或已過期，請重新輸入或寄送。');}catch(e){setError(e instanceof Error?e.message:'登入未完成');}finally{setBusy(false);}};
 const save=async()=>{setBusy(true);setError('');try{await saveContact({data:memberContactSchema.parse({name,phone})});await cache.invalidateQueries({queryKey:['member-contact']});navigate({to:'/coupons'});}catch{setError('請確認姓名與 09 開頭的 10 碼電話；若資料正確，請稍後再試。');}finally{setBusy(false);}};
 const inputClass='mt-1 w-full rounded-lg border border-input bg-background px-3 py-3 text-sm';
 return <main className="mx-auto min-h-screen max-w-md px-5 py-10"><img src={catLogo} alt="奶油貓" className="mx-auto h-24 w-24 object-contain"/><p className="mt-4 text-center text-xs text-secondary-foreground">クリームキャット・メンバー</p><h1 className="mt-2 text-center text-2xl font-bold">奶油貓會員</h1><p className="my-5 text-center text-sm text-muted-foreground">{userId?'會員收件資料':'Email 驗證登入・不用設定密碼'}</p>
 {!ready?<p role="status">確認登入狀態…</p>:userId?<form className="space-y-4" onSubmit={e=>{e.preventDefault();void save();}}>
 {contact.isPending?<p role="status">讀取會員資料…</p>:contact.isError?<p role="alert" className="text-destructive">讀取失敗，請重新整理。</p>:<><label className="block text-sm">姓名<input autoComplete="name" required maxLength={50} value={name} onChange={e=>setName(e.target.value)} className={inputClass}/></label><label className="block text-sm">手機號碼<input autoComplete="tel" type="tel" inputMode="tel" required pattern="09[0-9]{8}" maxLength={10} value={phone} onChange={e=>setPhone(e.target.value)} className={inputClass}/></label><label className="block text-sm">Email<input type="email" value={email} readOnly className={inputClass}/></label><p className="text-xs text-muted-foreground">電話用於寄送聯絡，不作為登入或身分驗證依據。</p><Button type="submit" className="w-full" disabled={busy}>儲存資料・前往我的折價券</Button></>}
 <Button type="button" variant="outline" className="w-full" onClick={async()=>{await cache.cancelQueries();cache.clear();await supabase.auth.signOut();setStage('email');setCode('');navigate({to:'/auth',replace:true});}}>登出會員</Button></form>:<form className="space-y-4" onSubmit={e=>{e.preventDefault();void (stage==='email'?send():verify());}}><label className="block text-sm">Email<input autoComplete="email" type="email" required maxLength={100} value={email} readOnly={stage==='code'} onChange={e=>setEmail(e.target.value)} className={inputClass}/></label>{stage==='code'&&<><p role="status" className="text-sm text-muted-foreground">驗證信已寄出，請查看收件匣與垃圾郵件。</p><label className="block text-sm">Email 驗證碼<input autoComplete="one-time-code" inputMode="numeric" required pattern="[0-9]{6,8}" minLength={6} maxLength={8} value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,''))} className={inputClass}/></label><div className="flex justify-between"><Button type="button" variant="link" onClick={()=>{setStage('email');setCode('');setError('');}}><ArrowLeft/>更換 Email</Button><Button type="button" variant="link" disabled={busy||cooldown>0} onClick={()=>void send()}>{cooldown>0?`重新寄送（${cooldown}秒）`:'重新寄送'}</Button></div></>}<Button type="submit" className="w-full" disabled={busy}><Mail/>{busy?'處理中…':stage==='email'?'寄送驗證碼':'驗證並登入'}</Button></form>}
 {error&&<p role="alert" className="mt-3 break-words text-sm text-destructive">{error}</p>}<div className="text-center"><Button variant="link" className="mt-5" onClick={()=>navigate({to:'/'})}>返回扭蛋屋</Button></div></main>;
}
