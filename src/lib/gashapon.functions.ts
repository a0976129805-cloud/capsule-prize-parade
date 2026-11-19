import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { gashaponProductUrl, isBandaiImage, parseGashaponHtml, type GashaponDraft } from "@/lib/gashapon-import";

const admin = () => import("@/integrations/supabase/client.server").then((m) => m.supabaseAdmin);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const UA = "Mozilla/5.0 (compatible; ButtercatGachaImport/1.0)";

async function requireAdmin() {
  const s = await useSession<{ admin?: boolean }>({
    password: process.env["SESSION_SECRET"]!, name: "gacha-admin",
    cookie: { httpOnly: true, secure: true, sameSite: "none", path: "/" },
  });
  if (!s.data.admin) throw new Error("Forbidden");
}

/** Owner-only: read one official Bandai product page and copy its photos into the shop's image storage. Nothing is published. */
export const adminImportGashapon = createServerFn({ method: "POST" })
  .validator((d: { url: string }) => ({ url: String(d?.url ?? "").slice(0, 300) }))
  .handler(async ({ data }): Promise<GashaponDraft> => {
    await requireAdmin();
    const url = gashaponProductUrl(data.url);
    if (!url) throw new Error("目前只支援萬代官網 gashapon.jp 的商品頁網址");
    const page = await fetch(url, { headers: { "User-Agent": UA, "Accept-Language": "ja" }, signal: AbortSignal.timeout(15000) });
    if (!page.ok) throw new Error(`萬代官網回應 ${page.status}，請稍後再試`);
    const draft = parseGashaponHtml(await page.text(), url);

    const db = await admin();
    const copied = new Map<string, string>();
    const copy = async (src: string) => {
      if (!isBandaiImage(src)) return "";
      const res = await fetch(src, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(15000) });
      const type = res.headers.get("content-type") ?? "";
      if (!res.ok || !/^image\/(jpeg|png)$/.test(type)) return "";
      const bytes = new Uint8Array(await res.arrayBuffer());
      if (bytes.length > MAX_IMAGE_BYTES) return "";
      const name = `bandai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${type === "image/png" ? "png" : "jpg"}`;
      const { error } = await db.storage.from("gacha-images").upload(name, bytes, { contentType: type, upsert: false });
      return error ? "" : `/api/public/img/${name}`;
    };
    const unique = [...new Set([draft.cover, ...draft.items.map((i) => i.image)])];
    for (let i = 0; i < unique.length; i += 6) {
      const batch = unique.slice(i, i + 6);
      const urls = await Promise.all(batch.map((src) => copy(src).catch(() => "")));
      batch.forEach((src, j) => copied.set(src, urls[j]));
    }
    return { ...draft, cover: copied.get(draft.cover) ?? "", items: draft.items.map((it) => ({ ...it, image: copied.get(it.image) ?? "" })) };
  });
