import {describe,it,expect} from 'vitest';
import {emptyRewards,newcomerPreview,rewardSettingsSchema,couponDiscount,bestCoupon,usableCoupon,type Coupon} from '@/lib/rewards';
import {orderTotal} from '@/lib/shipping';
import {buildMyshipRows} from '@/lib/exportMyship';
const c:Coupon={id:'one',name:'測試券',amount:20,minimum:300,expires_at:'2099-01-01',used_order_id:null};
describe('會員優惠規則',()=>{
 it('預設全部停用，不擅自送折扣',()=>{expect(emptyRewards.enabled).toBe(false);expect(emptyRewards.newcomer.enabled).toBe(false);expect(emptyRewards.daily.enabled).toBe(false);expect(emptyRewards.streak.enabled).toBe(false);});
 it('需滿額才折抵',()=>{expect(couponDiscount(c,299)).toBe(0);expect(couponDiscount(c,300)).toBe(20);});
 it('只選一張最大折扣，不能疊加',()=>{const selected=bestCoupon([c,{...c,id:'two',amount:50}],500);expect(selected?.id).toBe('two');expect(couponDiscount(selected,500)).toBe(50);});
 it('已使用券不可再次使用',()=>expect(usableCoupon({...c,used_order_id:'ORD-1'},500)).toBe(false));
 it('到期當下不可使用',()=>expect(usableCoupon(c,500,new Date(c.expires_at).getTime())).toBe(false));
 it('啟用優惠需設定正折扣',()=>expect(rewardSettingsSchema.safeParse({...emptyRewards,newcomer:{...emptyRewards.newcomer,enabled:true}}).success).toBe(false));
 it('每日機率必須合计100',()=>expect(rewardSettingsSchema.safeParse({...emptyRewards,daily:{enabled:true,options:emptyRewards.daily.options.map(o=>({...o,amount:20,minimum:300,weight:10}))}}).success).toBe(false));
 it('免運門檻維持折前1000，未滿運費38',()=>{expect(orderTotal([1000]).fee).toBe(0);expect(orderTotal([999]).fee).toBe(38);expect(orderTotal([1000]).total-couponDiscount(c,1000)).toBe(980);});
 it('賣貨便商品代收欄與運費是折後金額',()=>{const rows=buildMyshipRows([{id:'ORD-test',total:318,fee:38,createdAt:'2026/11/8',items:[{name:'扭蛋'}],shipping:{name:'測試',phone:'0900000000',email:'test@example.com',storeCode:'123456'}}]);expect(rows[6]?.[5]).toBe(280);expect(rows[6]?.[6]).toBe(38);expect(rows[6]?.length).toBe(10);});
});