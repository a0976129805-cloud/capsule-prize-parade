import {describe,it,expect} from 'vitest';
import {emptyRewards,newcomerPreview,rewardSettingsSchema,couponDiscount,bestCoupon,usableCoupon,type Coupon} from '@/lib/rewards';
import {orderTotal} from '@/lib/shipping';
import {buildMyshipRows} from '@/lib/exportMyship';
import {emptyPromoCode,promoCodeSchema} from '@/lib/promo-codes';
const c:Coupon={id:'one',name:'測試券',amount:20,minimum:300,expires_at:'2099-01-01',used_order_id:null};
describe('會員優惠規則',()=>{
 it('預設全部停用，不擅自送折扣',()=>{expect(emptyRewards.enabled).toBe(false);expect(emptyRewards.newcomer.enabled).toBe(false);expect(emptyRewards.daily.enabled).toBe(false);expect(emptyRewards.streak.enabled).toBe(false);});
 it('新人禮未啟用時不在首頁宣傳',()=>{expect(newcomerPreview(emptyRewards)).toEqual({enabled:false});});
 it('全館停用時即使新人券開著也不宣傳',()=>{expect(newcomerPreview({...emptyRewards,newcomer:{...emptyRewards.newcomer,enabled:true,amount:20,minimum:100}})).toEqual({enabled:false});});
 it('首頁只取得實際新人券條件，不公開其他優惠設定',()=>{const result=newcomerPreview({...emptyRewards,enabled:true,newcomer:{enabled:true,name:'迎新試手氣',amount:20,minimum:100,days:7},streak:{...emptyRewards.streak,enabled:true,amount:50,minimum:500}});expect(result).toEqual({enabled:true,name:'迎新試手氣',amount:20,minimum:100,days:7});expect(result).not.toHaveProperty('streak');});
 it('需滿額才折抵',()=>{expect(couponDiscount(c,299)).toBe(0);expect(couponDiscount(c,300)).toBe(20);});
 it('只選一張最大折扣，不能疊加',()=>{const selected=bestCoupon([c,{...c,id:'two',amount:50}],500);expect(selected?.id).toBe('two');expect(couponDiscount(selected,500)).toBe(50);});
 it('已使用券不可再次使用',()=>expect(usableCoupon({...c,used_order_id:'ORD-1'},500)).toBe(false));
 it('到期當下不可使用',()=>expect(usableCoupon(c,500,new Date(c.expires_at).getTime())).toBe(false));
 it('啟用優惠需設定正折扣',()=>expect(rewardSettingsSchema.safeParse({...emptyRewards,newcomer:{...emptyRewards.newcomer,enabled:true}}).success).toBe(false));
 it('每日機率必須合计100',()=>expect(rewardSettingsSchema.safeParse({...emptyRewards,daily:{enabled:true,options:emptyRewards.daily.options.map(o=>({...o,amount:20,minimum:300,weight:10}))}}).success).toBe(false));
 it('免運門檻維持折前1000，未滿運費38',()=>{expect(orderTotal([1000]).fee).toBe(0);expect(orderTotal([999]).fee).toBe(38);expect(orderTotal([1000]).total-couponDiscount(c,1000)).toBe(980);});
 it('賣貨便商品代收欄與運費是折後金額',()=>{const rows=buildMyshipRows([{id:'ORD-test',total:318,fee:38,createdAt:'2026/11/8',items:[{name:'扭蛋'}],shipping:{name:'測試',phone:'0900000000',email:'test@example.com',storeCode:'123456'}}]);expect(rows[6]?.[5]).toBe(280);expect(rows[6]?.[6]).toBe(38);expect(rows[6]?.length).toBe(10);});
});

describe('店長自訂優惠代碼',()=>{
 const valid={code:'threads100',name:'Threads 專屬見面禮',amount:100,minimum:1000,days:7,enabled:true};
 it('新代碼預設不開放，不擅自發折扣',()=>expect(emptyPromoCode.enabled).toBe(false));
 it('代碼忽略前後空白並統一為大寫',()=>expect(promoCodeSchema.parse({...valid,code:' threads100 '}).code).toBe('THREADS100'));
 it('折扣必須大於零',()=>expect(promoCodeSchema.safeParse({...valid,amount:0}).success).toBe(false));
 it('最低消費不能低於折扣',()=>expect(promoCodeSchema.safeParse({...valid,minimum:99}).success).toBe(false));
 it('有效期限只能設定1至90天',()=>{expect(promoCodeSchema.safeParse({...valid,days:0}).success).toBe(false);expect(promoCodeSchema.safeParse({...valid,days:91}).success).toBe(false);});
 it('代碼只接受英文數字與連字號底線',()=>{expect(promoCodeSchema.safeParse({...valid,code:'THREADS 100'}).success).toBe(false);expect(promoCodeSchema.safeParse({...valid,code:'cat_50'}).success).toBe(true);});
});