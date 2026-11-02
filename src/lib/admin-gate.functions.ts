import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";

type GateSession = { admin?: boolean };

const config = () => ({
  password: process.env["SESSION_SECRET"]!,
  name: "gacha-admin",
  maxAge: 60 * 60 * 24 * 7,
  cookie: { httpOnly: true, secure: true, sameSite: "none" as const, path: "/" },
});

async function sha(s: string) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)));
}

export const checkAdmin = createServerFn({ method: "GET" }).handler(async () => {
  const s = await useSession<GateSession>(config());
  return { ok: !!s.data.admin };
});

export const unlockAdmin = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string }) => ({ password: String(d.password).slice(0, 200) }))
  .handler(async ({ data }) => {
    const expected = process.env["ADMIN_PASSWORD"];
    if (!expected) throw new Error("ADMIN_PASSWORD is not set");
    const [a, b] = await Promise.all([sha(data.password), sha(expected)]);
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
    if (diff !== 0) return { ok: false };
    const s = await useSession<GateSession>(config());
    await s.update({ admin: true });
    return { ok: true };
  });

export const lockAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const s = await useSession<GateSession>(config());
  await s.clear();
  return { ok: true };
});
