import { createServerFn } from "@tanstack/react-start";
import { useSession, getRequestHeader } from "@tanstack/react-start/server";
import { VAULT_MS } from "@/lib/shipping";
import { emptySeller, type Seller } from "@/lib/export711";
import { validateMachineOrder } from '@/lib/machine-order';
import { rollCards } from '@/lib/cat-cards';
import { validDispatchDate, type Fulfillment } from '@/lib/fulfillment';

async function optionalMember(db: Awaited<ReturnType<typeof admin>>) {
  const bearer = getRequestHeader('authorization');
  if (!bearer) return undefined;
  if (!bearer.startsWith('Bearer ')) throw new Error('請重新登入');
  const { data, error } = await db.auth.getUser(bearer.slice(7));
  if (error || !data.user) throw new Error('請重新登入');
  return data.user.id;
}

export type Item = { id: string; name: string; image: string; stock: number };
export type Machine = Fulfillment & { id: string; title: string; price: number; totalStock: number; setPrice: number; coverImage: string; status: string; items: Item[]; lastOneName?: string; lastOneImage?: string; lastOneAwarded?: boolean };
export type VaultItem = Fulfillment & { vaultId: string; id: string; name: string; image: string; machineTitle: string; drawnAt: string; price: number; isLastOne?: boolean };
export type Shipping = { name: string; phone: string; email: string; storeName: string; storeCode: string };
export type Order = { id: string; items: VaultItem[]; shipping: Shipping; total: number; fee: number; count: number; createdAt: string; status: string; discount?: number; couponName?: string; hasPreorder?: boolean; dispatchDate?: string | null };

const admin = () => import("@/integrations/supabase/client.server").then((m) => m.supabaseAdmin);
const dev = (d: unknown) => String(d ?? "").slice(0, 80);

async function requireAdmin() {
  const s = await useSession<{ admin?: boolean }>({
    password: process.env["SESSION_SECRET"]!, name: "gacha-admin",
    cookie: { httpOnly: true, secure: true, sameSite: "none", path: "/" },
  });
  if (!s.data.admin) throw new Error("Forbidden");
}

export const listMachines = createServerFn({ method: "GET" }).handler(async () => {
  const db = await admin();
  const [{ data: p }, { data: z }] = await Promise.all([
    db.from("products").select("*").order("sort").order("created_at").order("id"),
    db.from("prizes").select("*").order("sort"),
  ]);
  return (p ?? []).map((m): Machine => {
    const items = (z ?? []).filter((x) => x.product_id === m.id).map((x) => ({ id: x.id, name: x.name, image: x.image, stock: x.stock }));
    return { id: m.id, title: m.title, price: m.price, setPrice: m.set_price ?? 0, coverImage: m.cover_image, status: m.status, items, totalStock: items.reduce((a, i) => a + i.stock, 0), lastOneName: m.last_one_name, lastOneImage: m.last_one_image, lastOneAwarded: m.last_one_awarded, fulfillmentType: m.fulfillment_type === 'preorder' ? 'preorder' : 'stock', dispatchDate: m.dispatch_date };
  });
});

type VRow = { id: string; prize_id: string; name: string; image: string; machine_title: string; price: number; drawn_at: string; is_last_one?: boolean; fulfillment_type?: string; dispatch_date?: string | null };
const toVault = (r: VRow): VaultItem => ({ vaultId: r.id, id: r.prize_id, name: r.name, image: r.image, machineTitle: r.machine_title, price: r.price, drawnAt: r.drawn_at, isLastOne: r.is_last_one ?? false, fulfillmentType: r.fulfillment_type === 'preorder' ? 'preorder' : 'stock', dispatchDate: r.dispatch_date ?? null });

/** Releases (returns to machine stock) unordered vault items older than the free storage period. */
async function purgeExpired(db: Awaited<ReturnType<typeof admin>>, deviceId?: string) {
  const cutoff = new Date(Date.now() - VAULT_MS).toISOString();
  await db.rpc("release_expired_vault", deviceId ? { _cutoff: cutoff, _device: deviceId } : { _cutoff: cutoff });
}

export const myVault = createServerFn({ method: "POST" })
  .validator((d: { deviceId: string }) => ({ deviceId: dev(d.deviceId) }))
  .handler(async ({ data }) => {
    const db = await admin();
    const user = await optionalMember(db);
    if (!user && data.deviceId.startsWith('member:')) throw new Error('請先登入會員');
    const owner = user ? `member:${user}` : data.deviceId;
    await purgeExpired(db, owner);
    const { data: rows } = await db.from("vault_items").select("*").eq("device_id", owner).is("order_id", null).order("drawn_at");
    return (rows ?? []).map(toVault);
  });

export const drawPrizes = createServerFn({ method: "POST" })
  .validator((d: { machineId: string; count: number; deviceId: string }) => ({ machineId: String(d.machineId), count: d.count === 5 ? 5 : 1, deviceId: dev(d.deviceId) }))
  .handler(async ({ data }) => {
    if (!data.deviceId) return { ok: false as const, error: "裝置識別失敗" };
    const db = await admin();
    const user = await optionalMember(db);
    if (!user) return { ok: false as const, error: "請先登入會員再抽蛋" };
    const cards = rollCards(data.count);
    const { data: rows, error } = await db.rpc("reserve_member_draw", { _user: user, _product: data.machineId, _nos: cards, _device: `member:${user}` });
    if (error) { console.error('Member reservation failed', error.code, error.message); return { ok: false as const, error: error.message.includes("姓名") ? "請先到會員帳戶填寫姓名與電話" : "抽獎失敗，請再試一次" }; }
    if (!rows?.length) return { ok: false as const, error: "庫存不足！" };
    return { ok: true as const, items: (rows as VRow[]).map(toVault), cards };
  });

export const buySet = createServerFn({ method: "POST" })
  .validator((d: { machineId: string; deviceId: string }) => ({ machineId: String(d.machineId), deviceId: dev(d.deviceId) }))
  .handler(async ({ data }) => {
    if (!data.deviceId) return { ok: false as const, error: "裝置識別失敗" };
    const db = await admin();
    const user = await optionalMember(db);
    if (!user) return { ok: false as const, error: "請先登入會員再購買" };
    const cards = rollCards(1);
    const { data: rows, error } = await db.rpc("reserve_member_draw", { _user: user, _product: data.machineId, _nos: cards, _set: true, _device: `member:${user}` });
    if (error) return { ok: false as const, error: error.message.includes("姓名") ? "請先到會員帳戶填寫姓名與電話" : "購買失敗，請再試一次" };
    if (!rows?.length) return { ok: false as const, error: "整套已無法購買（有款式售完）" };
    return { ok: true as const, items: (rows as VRow[]).map(toVault), cards };
  });

/** Ships EVERY unexpired item in the device's vault as one order; partial picking is not allowed. */
export const createOrder = createServerFn({ method: "POST" })
  .validator((d: { deviceId: string; shipping: Shipping; agreed: boolean; couponId?: string; preorderAgreed?: boolean; dispatchDate?: string | null }) => d)
  .handler(async ({ data }) => {
    const s = data.shipping;
    const deviceId = dev(data.deviceId);
    if (!data.agreed) throw new Error("請先同意出貨規則");
    if (!s.name?.trim() || !/^09\d{8}$/.test(s.phone) || !/^\S+@\S+\.\S+$/.test(s.email) || !s.storeName?.trim() || !/^\d{6}$/.test(s.storeCode)) throw new Error("資料不完整");
    const db = await admin();
    const userId = await optionalMember(db);
    if (!userId) throw new Error('請先登入會員結帳');
    const owner = `member:${userId}`;
    const {data:result,error}=await db.rpc('checkout_vault',{_device:owner,_shipping:{ ...s, preorderAgreed: data.preorderAgreed === true, dispatchDate: data.dispatchDate ?? '' },_user:userId,...(data.couponId?{_coupon:data.couponId}: {})});
    if(error)throw new Error(error.message);
    return result as {id:string;total:number;discount:number};
  });

type ORow = { id: string; items: unknown; ship_name: string; ship_phone: string; ship_email: string; store_name: string; store_code: string; total: number; shipping_fee: number; item_count: number; created_at: string; status: string; discount?: number; coupon_name?: string; has_preorder?: boolean; dispatch_date?: string | null };
const toOrder = (o: ORow): Order => ({
  id: o.id, items: o.items as VaultItem[], total: o.total, fee: o.shipping_fee, count: o.item_count || (o.items as unknown[]).length, status: o.status, discount:o.discount??0,couponName:o.coupon_name??'',
  hasPreorder: o.has_preorder ?? false, dispatchDate: o.dispatch_date ?? null,
  createdAt: new Date(o.created_at).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" }),
  shipping: { name: o.ship_name, phone: o.ship_phone, email: o.ship_email, storeName: o.store_name, storeCode: o.store_code },
});

export const myOrders = createServerFn({ method: "POST" })
  .validator((d: { deviceId: string }) => ({ deviceId: dev(d.deviceId) }))
  .handler(async ({ data }) => {
    const db = await admin();
    const user = await optionalMember(db);
    if (!user && data.deviceId.startsWith('member:')) throw new Error('請先登入會員');
    const owner = user ? `member:${user}` : data.deviceId;
    const { data: rows } = await db.from("orders").select("*").eq("device_id", owner).order("created_at", { ascending: false });
    return (rows ?? []).map(toOrder);
  });

export const adminOrders = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const db = await admin();
  await purgeExpired(db);
  const { data: rows } = await db.from("orders").select("*").order("created_at", { ascending: false });
  return (rows ?? []).map(toOrder);
});

export const adminSetOrderStatus = createServerFn({ method: "POST" })
  .validator((d: { id: string; status: string }) => d)
  .handler(async ({ data }) => {
    await requireAdmin();
    const db = await admin();
    await db.from("orders").update({ status: data.status }).eq("id", data.id);
    return { ok: true };
  });

export const adminSaveMachine = createServerFn({ method: "POST" })
  .validator((m: Machine) => m)
  .handler(async ({ data: m }) => {
    await requireAdmin();
    const db = await admin();
    const items = m.items.map((it) => ({ ...it, stock: Math.max(0, Math.floor(Number(it.stock) || 0)) }));
    const total = items.reduce((a, i) => a + i.stock, 0);
    const fulfillment = m.fulfillmentType === 'preorder' ? 'preorder' : 'stock';
    const dispatchDate = fulfillment === 'preorder' ? String(m.dispatchDate ?? '') : null;
    if (fulfillment === 'preorder' && (!dispatchDate || !validDispatchDate(dispatchDate))) throw new Error('請設定有效預計出貨日期');
    const { error } = await db.from("products").upsert({ id: m.id, title: m.title, price: m.price, total_stock: total, set_price: Math.max(0, Math.floor(Number(m.setPrice) || 0)), cover_image: m.coverImage, status: m.status, last_one_name: String(m.lastOneName ?? '').trim().slice(0, 120), last_one_image: String(m.lastOneImage ?? '').slice(0, 2000), fulfillment_type: fulfillment, dispatch_date: dispatchDate });
    if (error) throw new Error(error.message);
    await db.from("prizes").delete().eq("product_id", m.id);
    if (items.length) await db.from("prizes").insert(items.map((it, i) => ({ id: it.id, product_id: m.id, name: it.name, image: it.image, stock: it.stock, sort: i })));
    return { ok: true };
  });

export const adminReorderMachines = createServerFn({ method: 'POST' })
  .inputValidator(validateMachineOrder)
  .handler(async ({ data }) => {
    await requireAdmin();
    const db = await admin();
    const { error } = await db.rpc('reorder_machines', { _ids: data.ids, _expected: data.expected });
    if (error) {
      if (error.message.includes('ORDER_CHANGED')) throw new Error('機台順序已變更，請重新排列');
      throw new Error('儲存排序失敗，請再試一次');
    }
    return { ok: true };
  });

export const adminDeleteMachine = createServerFn({ method: "POST" })
  .validator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    await requireAdmin();
    const db = await admin();
    await db.from("products").delete().eq("id", data.id);
    return { ok: true };
  });

export const adminGetSeller = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const db = await admin();
  const { data } = await db.from("shop_settings").select("data").eq("id", 1).maybeSingle();
  return { ...emptySeller, ...((data?.data as Partial<Seller>) ?? {}) } as Seller;
});

export const adminSaveSeller = createServerFn({ method: "POST" })
  .validator((d: Seller) => d)
  .handler(async ({ data }) => {
    await requireAdmin();
    const clean = Object.fromEntries(Object.keys(emptySeller).map((k) => [k, String((data as Record<string, unknown>)[k] ?? "").trim().slice(0, 100)]));
    const db = await admin();
    const { error } = await db.from("shop_settings").upsert({ id: 1, data: clean });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
