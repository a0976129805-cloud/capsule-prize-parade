import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";

export type Item = { id: string; name: string; image: string };
export type Machine = { id: string; title: string; price: number; totalStock: number; coverImage: string; status: string; items: Item[] };
export type VaultItem = Item & { vaultId: string; machineTitle: string; drawnAt: string; price: number };
export type Shipping = { name: string; phone: string; storeName: string; storeCode: string };
export type Order = { id: string; items: VaultItem[]; shipping: Shipping; total: number; createdAt: string; status: string };

const admin = () => import("@/integrations/supabase/client.server").then((m) => m.supabaseAdmin);

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
  return (p ?? []).map((m): Machine => ({
    id: m.id, title: m.title, price: m.price, totalStock: m.total_stock, coverImage: m.cover_image, status: m.status,
    items: (z ?? []).filter((x) => x.product_id === m.id).map((x) => ({ id: x.id, name: x.name, image: x.image })),
  }));
});

export const drawPrizes = createServerFn({ method: "POST" })
  .validator((d: { machineId: string; count: number }) => ({ machineId: String(d.machineId), count: d.count === 5 ? 5 : 1 }))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: items } = await db.from("prizes").select("id,name,image").eq("product_id", data.machineId);
    if (!items?.length) return { ok: false as const, error: "此機台尚無商品" };
    const { data: ok } = await db.rpc("take_stock", { _product: data.machineId, _n: data.count });
    if (!ok) return { ok: false as const, error: "庫存不足！" };
    return { ok: true as const, items: Array.from({ length: data.count }, () => items[Math.floor(Math.random() * items.length)]!) };
  });

export const createOrder = createServerFn({ method: "POST" })
  .validator((d: { deviceId: string; items: VaultItem[]; shipping: Shipping }) => d)
  .handler(async ({ data }) => {
    const s = data.shipping;
    if (!data.items.length || !s.name || !s.phone || !s.storeName || !s.storeCode) throw new Error("資料不完整");
    const id = "ORD-" + Date.now().toString().slice(-8);
    const total = data.items.reduce((a, i) => a + (Number(i.price) || 0), 0);
    const db = await admin();
    const { error } = await db.from("orders").insert({
      id, device_id: String(data.deviceId).slice(0, 80), items: data.items.slice(0, 200) as never,
      ship_name: s.name.slice(0, 50), ship_phone: s.phone.slice(0, 20), store_name: s.storeName.slice(0, 50), store_code: s.storeCode.slice(0, 20), total,
    });
    if (error) throw new Error(error.message);
    return { id };
  });

const toOrder = (o: { id: string; items: unknown; ship_name: string; ship_phone: string; store_name: string; store_code: string; total: number; created_at: string; status: string }): Order => ({
  id: o.id, items: o.items as VaultItem[], total: o.total, status: o.status, createdAt: new Date(o.created_at).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" }),
  shipping: { name: o.ship_name, phone: o.ship_phone, storeName: o.store_name, storeCode: o.store_code },
});

export const myOrders = createServerFn({ method: "POST" })
  .validator((d: { deviceId: string }) => ({ deviceId: String(d.deviceId) }))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: rows } = await db.from("orders").select("*").eq("device_id", data.deviceId).order("created_at", { ascending: false });
    return (rows ?? []).map(toOrder);
  });

export const adminOrders = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const db = await admin();
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
    const { error } = await db.from("products").upsert({ id: m.id, title: m.title, price: m.price, total_stock: m.totalStock, cover_image: m.coverImage, status: m.status });
    if (error) throw new Error(error.message);
    await db.from("prizes").delete().eq("product_id", m.id);
    if (m.items.length) await db.from("prizes").insert(m.items.map((it, i) => ({ id: it.id, product_id: m.id, name: it.name, image: it.image, sort: i })));
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
