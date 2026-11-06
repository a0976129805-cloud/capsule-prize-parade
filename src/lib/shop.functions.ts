import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { emptyShopInfo, type ShopInfo } from "@/lib/shop-info";

const admin = () => import("@/integrations/supabase/client.server").then((m) => m.supabaseAdmin);
const PUBLIC_ROW = 2; // row 1 holds private seller/bank data; row 2 is safe public store info

async function requireAdmin() {
  const s = await useSession<{ admin?: boolean }>({
    password: process.env["SESSION_SECRET"]!, name: "gacha-admin",
    cookie: { httpOnly: true, secure: true, sameSite: "none", path: "/" },
  });
  if (!s.data.admin) throw new Error("Forbidden");
}

export const getShopInfo = createServerFn({ method: "GET" }).handler(async () => {
  const db = await admin();
  const { data } = await db.from("shop_settings").select("data").eq("id", PUBLIC_ROW).maybeSingle();
  return { ...emptyShopInfo, ...((data?.data as Partial<ShopInfo>) ?? {}) } as ShopInfo;
});

export const adminSaveShopInfo = createServerFn({ method: "POST" })
  .validator((d: ShopInfo) => d)
  .handler(async ({ data }) => {
    await requireAdmin();
    const clean: Record<string, unknown> = Object.fromEntries(Object.keys(emptyShopInfo).filter((k) => k !== "banners").map((k) => [k, String((data as Record<string, unknown>)[k] ?? "").trim().slice(0, 500)]));
    clean.banners = (Array.isArray(data.banners) ? data.banners : []).map(String).filter((u) => /^\/api\/public\/img\/[\w.-]+$/.test(u)).slice(0, 8);
    for (const k of ["lineUrl", "igUrl"]) if (clean[k] && !/^https:\/\//.test(String(clean[k]))) throw new Error("連結需以 https:// 開頭");
    const db = await admin();
    const { error } = await db.from("shop_settings").upsert({ id: PUBLIC_ROW, data: clean as never });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Admin-only image upload; returns a public URL served by /api/public/img. */
export const adminUploadImage = createServerFn({ method: "POST" })
  .validator((d: { base64: string; type: string }) => d)
  .handler(async ({ data }) => {
    await requireAdmin();
    const ext = data.type === "image/png" ? "png" : data.type === "image/webp" ? "webp" : "jpg";
    const bytes = Uint8Array.from(atob(data.base64), (c) => c.charCodeAt(0));
    if (bytes.length > 5 * 1024 * 1024) throw new Error("圖片太大");
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const db = await admin();
    const { error } = await db.storage.from("gacha-images").upload(name, bytes, { contentType: data.type, upsert: false });
    if (error) throw new Error(error.message);
    return { url: `/api/public/img/${name}` };
  });
