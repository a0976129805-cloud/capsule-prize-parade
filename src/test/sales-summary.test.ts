import { describe,expect,it } from 'vitest';
import { salesSummary } from '@/lib/sales-summary';
import { filterMachines } from '@/lib/machine-filters';
import type { Machine,Order,VaultItem } from '@/lib/gacha.functions';
const machine:Machine={id:'m',title:'日本扭蛋',price:100,setPrice:300,totalStock:4,coverImage:'',status:'販售中',items:[{id:'p',name:'款式A',image:'',stock:4}],fulfillmentType:'stock'};
const item:VaultItem={vaultId:'v',id:'p',name:'款式A',machineTitle:'日本扭蛋',image:'',price:100,drawnAt:''};
const order:Order={id:'o',items:[item],shipping:{name:'',phone:'',email:'',storeName:'',storeCode:''},total:118,fee:38,count:1,createdAt:'',status:'待出貨',discount:20};
describe('sales snapshots',()=>{
 it('counts stored item price, excluding shipping and applying discount once',()=>{const s=salesSummary([order],[{...machine,price:999}]);expect([s.gross,s.net,s.count,s.orders]).toEqual([100,80,1,1]);});
 it('excludes cancelled orders',()=>{expect(salesSummary([{...order,status:'已取消'}],[machine]).count).toBe(0);});
 it('excludes last-one gifts from paid quantities',()=>{expect(salesSummary([{...order,items:[item,{...item,isLastOne:true,price:0}]}],[machine])).toMatchObject({count:1,gifts:1,gross:100});});
 it('separates collected orders from uncollected orders',()=>{expect(salesSummary([order,{...order,id:'2',status:'已取貨'}],[machine],'collected').orders).toBe(1);});
 it('retains sales for removed machines',()=>{expect(salesSummary([order],[]).rows[0]).toMatchObject({title:'日本扭蛋',count:1,stock:null});});
});
describe('machine discovery',()=>{
 it('stock excludes preorder and sold out machines',()=>{expect(filterMachines([machine,{...machine,id:'pre',fulfillmentType:'preorder'},{...machine,id:'out',totalStock:0}],'stock','').map(m=>m.id)).toEqual(['m']);});
 it('featured uses the first eight available machines in owner order',()=>{const list=Array.from({length:10},(_,i)=>({...machine,id:String(i)}));expect(filterMachines(list,'featured','').map(m=>m.id)).toEqual(['0','1','2','3','4','5','6','7']);});
 it('last one excludes awarded or unavailable gifts',()=>{expect(filterMachines([{...machine,lastOneName:'禮物'},{...machine,id:'used',lastOneName:'禮物',lastOneAwarded:true}],'lastone','').map(m=>m.id)).toEqual(['m']);});
 it('combines search and active filter',()=>{expect(filterMachines([machine],'stock','找不到')).toHaveLength(0);});
});