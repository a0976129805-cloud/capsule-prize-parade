import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { orderTotal, isExpired, VAULT_MS } from "@/lib/shipping";
import { emptySeller, type Seller } from "@/lib/export711";

export type Item = { id: string; name: string; image: string; stock: number };
export type Machine = { id: string; title: string; price: number; totalStock: number; setPrice: number; coverImage: string; status: string; items: Item[]; lastOneName?: string; lastOneImage?: string; lastOneAwarded?: boolean };
export type VaultItem = { vaultId: string; id: string; name: string; image: string; machineTitle: string; drawnAt: string; price: number; isLastOne?: boolean };
export type Shipping = { name: string; phone: string; email: string; storeName: string; storeCode: string };
export type Order = { id: string; items: VaultItem[]; shipping: Shipping; total: number; fee: number; count: number; createdAt: string; status: string };

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
    db.from("products").select("*").order("sort").order("created_at"),
    db.from("prizes").select("*").order("sort"),
  ]);
  return (p ?? []).map((m): Machine => {
    const items = (z ?? []).filter((x) => x.product_id === m.id).map((x) => ({ id: x.id, name: x.name, image: x.image, stock: x.stock }));
    return { id: m.id, title: m.title, price: m.price, setPrice: m.set_price ?? 0, coverImage: m.cover_image, status: m.status, items, totalStock: items.reduce((a, i) => a + i.stock, 0), lastOneName: m.last_one_name, lastOneImage: m.last_one_image, lastOneAwarded: m.last_one_awarded };
  });
});

type VRow = { id: string; prize_id: string; name: string; image: string; machine_title: string; price: number; drawn_at: string; is_last_one?: boolean };
const toVault = (r: VRow): VaultItem => ({ vaultId: r.id, id: r.prize_id, name: r.name, image: r.image, machineTitle: r.machine_title, price: r.price, drawnAt: r.drawn_at, isLastOne: r.is_last_one ?? false });

/** Releases (returns to machine stock) unordered vault items older than the free storage period. */
async function purgeExpired(db: Awaited<ReturnType<typeof admin>>, deviceId?: string) {
  const cutoff = new Date(Date.now() - VAULT_MS).toISOString();
  await db.rpc("release_expired_vault", deviceId ? { _cutoff: cutoff, _device: deviceId } : { _cutoff: cutoff });
}

export const myVault = createServerFn({ method: "POST" })
  .validator((d: { deviceId: string }) => ({ deviceId: dev(d.deviceId) }))
  .handler(async ({ data }) => {
    const db = await admin();
    await purgeExpired(db, data.deviceId);
    const { data: rows } = await db.from("vault_items").select("*").eq("device_id", data.deviceId).is("order_id", null).order("drawn_at");
    return (rows ?? []).map(toVault);
  });

export const drawPrizes = createServerFn({ method: "POST" })
  .validator((d: { machineId: string; count: number; deviceId: string }) => ({ machineId: String(d.machineId), count: d.count === 5 ? 5 : 1, deviceId: dev(d.deviceId) }))
  .handler(async ({ data }) => {
    if (!data.deviceId) return { ok: false as const, error: "裝置識別失敗" };
    const db = await admin();
    const { data: rows, error } = await db.rpc("draw_prizes", { _product: data.machineId, _n: data.count, _device: data.deviceId });
    if (error) return { ok: false as const, error: "抽獎失敗，請再試一次" };
    if (!rows?.length) return { ok: false as const, error: "庫存不足！" };
    return { ok: true as const, items: (rows as VRow[]).map(toVault) };
  });

export const buySet = createServerFn({ method: "POST" })
  .validator((d: { machineId: string; deviceId: string }) => ({ machineId: String(d.machineId), deviceId: dev(d.deviceId) }))
  .handler(async ({ data }) => {
    if (!data.deviceId) return { ok: false as const, error: "裝置識別失敗" };
    const db = await admin();
    const { data: rows, error } = await db.rpc("buy_set", { _product: data.machineId, _device: data.deviceId });
    if (error) return { ok: false as const, error: "購買失敗，請再試一次" };
    if (!rows?.length) return { ok: false as const, error: "整套已無法購買（有款式售完）" };
    return { ok: true as const, items: (rows as VRow[]).map(toVault) };
  });

/** Ships EVERY unexpired item in the device's vault as one order; partial picking is not allowed. */
export const createOrder = createServerFn({ method: "POST" })
  .validator((d: { deviceId: string; shipping: Shipping; agreed: boolean }) => d)
  .handler(async ({ data }) => {
    const s = data.shipping;
    const deviceId = dev(data.deviceId);
    if (!data.agreed) throw new Error("請先同意出貨規則");
    if (!s.name?.trim() || !/^09\d{8}$/.test(s.phone) || !/^\S+@\S+\.\S+$/.test(s.email) || !s.storeName?.trim() || !/^\d{6}$/.test(s.storeCode)) throw new Error("資料不完整");
    const db = await admin();
    await purgeExpired(db, deviceId);
    const { data: rows } = await db.from("vault_items").select("*").eq("device_id", deviceId).is("order_id", null);
    const items = (rows ?? []).filter((r) => !isExpired(r.drawn_at)).map(toVault);
    if (!items.length) throw new Error("倉庫沒有商品");
    const { fee, total } = orderTotal(items.map((i) => i.price));
    const id = "ORD-" + Date.now().toString().slice(-8) + Math.floor(Math.random() * 90 + 10);
    const { error } = await db.from("orders").insert({
      id, device_id: deviceId, items: items as never, item_count: items.length, shipping_fee: fee, total,
      ship_name: s.name.slice(0, 50), ship_phone: s.phone, ship_email: s.email.slice(0, 100), store_name: s.storeName.slice(0, 50), store_code: s.storeCode,
    });
    if (error) throw new Error(error.message);
    await db.from("vault_items").update({ order_id: id }).in("id", items.map((i) => i.vaultId));
    return { id, total };
  });

type ORow = { id: string; items: unknown; ship_name: string; ship_phone: string; ship_email: string; store_name: string; store_code: string; total: number; shipping_fee: number; item_count: number; created_at: string; status: string };
const toOrder = (o: ORow): Order => ({
  id: o.id, items: o.items as VaultItem[], total: o.total, fee: o.shipping_fee, count: o.item_count || (o.items as unknown[]).length, status: o.status,
  createdAt: new Date(o.created_at).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" }),
  shipping: { name: o.ship_name, phone: o.ship_phone, email: o.ship_email, storeName: o.store_name, storeCode: o.store_code },
});

export const myOrders = createServerFn({ method: "POST" })
  .validator((d: { deviceId: string }) => ({ deviceId: dev(d.deviceId) }))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: rows } = await db.from("orders").select("*").eq("device_id", data.deviceId).order("created_at", { ascending: false });
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
    const { error } = await db.from("products").upsert({ id: m.id, title: m.title, price: m.price, total_stock: total, set_price: Math.max(0, Math.floor(Number(m.setPrice) || 0)), cover_image: m.coverImage, status: m.status, last_one_name: String(m.lastOneName ?? '').trim().slice(0, 120), last_one_image: String(m.lastOneImage ?? '').slice(0, 2000) });
    if (error) throw new Error(error.message);
    await db.from("prizes").delete().eq("product_id", m.id);
    if (items.length) await db.from("prizes").insert(items.map((it, i) => ({ id: it.id, product_id: m.id, name: it.name, image: it.image, stock: it.stock, sort: i })));
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
