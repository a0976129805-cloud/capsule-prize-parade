import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { checkAdmin, unlockAdmin, lockAdmin } from "@/lib/admin-gate.functions";
import {
  listMachines, drawPrizes, createOrder, myOrders, myVault, adminOrders, adminSetOrderStatus, adminSaveMachine, adminDeleteMachine,
  adminGetSeller, adminSaveSeller,
  type Machine, type VaultItem, type Shipping, type Order,
} from "@/lib/gacha.functions";
import { searchStores, getTowns, CITIES, type Store } from "@/lib/stores.functions";
import { orderTotal, timeLeft, FREE_SHIP_COUNT, SHIP_FEE, VAULT_HOURS } from "@/lib/shipping";
import { build711Rows, missingSeller, emptySeller, type Seller } from "@/lib/export711";
import { supabase } from "@/integrations/supabase/client";
import { getShopInfo, adminSaveShopInfo, adminUploadImage } from "@/lib/shop.functions";
import { emptyShopInfo, groupItems, type ShopInfo } from "@/lib/shop-info";
import catLogo from "@/assets/cat-logo.png";
import {
  Sparkles, Package, ShoppingBag, Settings, RotateCw, ArrowLeft,
  Plus, Trash2, Edit3, Check, Truck, Download, RefreshCw, MapPin, Search, X, AlertTriangle, Menu, Upload, MessageCircle, Instagram, BookOpen, ShieldCheck, Lock,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "クリームキャット ガチャ屋｜日系線上扭蛋・7-11 貨到付款" },
      { name: "description", content: "クリームキャット ガチャ屋：日系線上扭蛋屋，手機就能轉蛋，抽中商品存入倉庫，7-11 賣貨便貨到付款。" },
      { property: "og:title", content: "クリームキャット ガチャ屋" },
      { property: "og:description", content: "線上轉蛋、倉庫收藏、7-11 賣貨便貨到付款寄送。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: App,
});

const ORDER_STATUSES = ["待出貨", "已出貨", "已取貨", "已取消"];
const emptyShip: Shipping = { name: "", phone: "", email: "", storeName: "", storeCode: "" };
const RULES = `倉庫商品免費暫存 ${VAULT_HOURS} 小時，申請出貨時須將倉內所有扭蛋一併結帳寄出，無法單獨挑選放棄。逾期未出貨的商品將自動釋回機台。`;

function getDeviceId() {
  let id = localStorage.getItem("gacha-device");
  if (!id) { id = crypto.randomUUID(); localStorage.setItem("gacha-device", id); }
  return id;
}

function App() {
  const [tab, setTab] = useState<"home" | "vault" | "orders" | "admin">("home");
  const [machines, setMachines] = useState<Machine[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [vault, setVault] = useState<VaultItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<VaultItem[] | null>(null);
  const [phase, setPhase] = useState<null | "spin" | "drop" | "open">(null);
  const [ship, setShip] = useState<Shipping>(emptyShip);
  const [agreed, setAgreed] = useState(false);
  const [picker, setPicker] = useState(false);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);
  const [info, setInfo] = useState<ShopInfo>(emptyShopInfo);
  const fetchInfo = useServerFn(getShopInfo);
  const fetchMachines = useServerFn(listMachines);
  const doDraw = useServerFn(drawPrizes);
  const doOrder = useServerFn(createOrder);
  const fetchMine = useServerFn(myOrders);
  const fetchVault = useServerFn(myVault);

  const reloadMachines = () => fetchMachines().then(setMachines).catch(() => {});
  const reloadOrders = () => fetchMine({ data: { deviceId: getDeviceId() } }).then(setOrders).catch(() => {});
  const reloadVault = () => fetchVault({ data: { deviceId: getDeviceId() } }).then(setVault).catch(() => {});

  useEffect(() => {
    reloadMachines(); reloadOrders(); reloadVault(); fetchInfo().then(setInfo).catch(() => {});
    const ch = supabase.channel(`gacha-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => reloadMachines())
      .on("postgres_changes", { event: "*", schema: "public", table: "prizes" }, () => reloadMachines())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2500); };
  const selected = machines.find((m) => m.id === selectedId) || null;
  const sum = orderTotal(vault.map((v) => v.price));
  const oldest = vault[0]?.drawnAt;

  const draw = async (count: number) => {
    if (!selected || selected.totalStock < count) return flash("庫存不足！");
    setSpinning(true);
    setPhase("spin");
    const req = doDraw({ data: { machineId: selected.id, count, deviceId: getDeviceId() } }).catch(() => ({ ok: false as const, error: "連線失敗，請再試一次" }));
    const t1 = setTimeout(() => setPhase("drop"), 1600);
    const t2 = setTimeout(() => setPhase("open"), 2500);
    const [r] = await Promise.all([req, new Promise((res) => setTimeout(res, 3200))]);
    if (!r.ok) { clearTimeout(t1); clearTimeout(t2); setSpinning(false); setPhase(null); reloadMachines(); return flash(r.error); }
    setVault((p) => [...p, ...r.items]);
    reloadMachines();
    setSpinning(false);
    setPhase(null);
    setResult(r.items);
  };

  const checkout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vault.length) return flash("倉庫沒有商品");
    if (!/^09\d{8}$/.test(ship.phone)) return flash("請輸入 09 開頭的 10 碼手機號碼");
    if (!/^\d{6}$/.test(ship.storeCode)) return flash("請點選 7-11 取貨門市");
    if (!agreed) return flash("請先勾選同意出貨規則");
    setSending(true);
    try {
      await doOrder({ data: { deviceId: getDeviceId(), shipping: { ...ship }, agreed } });
    } catch { setSending(false); return flash("送出失敗，請確認資料後再試一次"); }
    setSending(false);
    setVault([]); setShip(emptyShip); setAgreed(false);
    await reloadOrders();
    flash("🎉 出貨申請已送出！");
    setTab("orders");
  };

  return (
    <div className="min-h-screen pb-24 text-foreground">
      <header className="sticky top-0 z-30 bg-primary text-primary-foreground shadow-md">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-2">
          <button onClick={() => { setTab("home"); setSelectedId(null); }} className="flex items-center gap-2 font-extrabold">
            <img src={catLogo} alt="クリームキャット" width={40} height={40} className="h-10 w-10 rounded-full bg-card object-contain p-0.5" />
            クリームキャット ガチャ屋
          </button>
          <button onClick={() => setMenu(true)} aria-label="選單" className="rounded-full p-2 hover:bg-primary-foreground/15"><Menu className="h-6 w-6" /></button>
        </div>
        {info.marquee && <div className="overflow-hidden bg-accent py-1 text-xs font-bold text-accent-foreground"><div className="animate-marquee">📢 {info.marquee}</div></div>}
      </header>

      <main className="mx-auto max-w-md px-4 py-4">
        {tab === "home" && !selected && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-accent p-4 text-accent-foreground">
              <p className="text-lg font-extrabold">今日のガチャ ✨</p>
              <p className="text-sm">抽中商品自動存入倉庫，集滿再一起寄！</p>
            </div>
            {machines.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">載入中…</p>}
            <div className="grid grid-cols-2 gap-3">
            {machines.map((m) => (
              <button key={m.id} onClick={() => setSelectedId(m.id)} className="flex flex-col overflow-hidden rounded-2xl border-2 border-border bg-card text-left shadow-sm transition active:scale-[.97]">
                <div className="relative aspect-square bg-muted">
                  <img src={m.coverImage} alt={m.title} loading="lazy" className="h-full w-full object-cover" />
                  <span className="absolute left-1.5 top-1.5 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">{m.totalStock <= 0 ? "已完售" : m.status}</span>
                  <span className="absolute bottom-1.5 right-1.5 rounded-full bg-card/90 px-2 py-0.5 text-sm font-extrabold text-primary">NT${m.price}</span>
                </div>
                <div className="p-2">
                  <p className="line-clamp-2 text-xs font-bold leading-snug">{m.title}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">剩餘 {m.totalStock} 顆</p>
                </div>
              </button>
            ))}
            </div>
          </div>
        )}

        {tab === "home" && selected && (
          <div className="space-y-4">
            <button onClick={() => setSelectedId(null)} className="flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" /> 返回列表</button>
            <div className="overflow-hidden rounded-2xl border-2 border-border bg-card">
              <img src={selected.coverImage} alt={selected.title} className="aspect-[16/9] w-full object-cover" />
              <div className="p-4">
                <h1 className="text-lg font-extrabold">{selected.title}</h1>
                <p className="text-sm text-muted-foreground">每抽 NT${selected.price}・剩餘 {selected.totalStock} 顆</p>
              </div>
            </div>
            <div className="flex flex-col items-center gap-4 rounded-2xl bg-secondary p-6">
              <div className={`flex h-24 w-24 items-center justify-center rounded-full border-4 border-card bg-[linear-gradient(180deg,var(--primary)_50%,var(--card)_50%)] shadow-lg ${spinning ? "animate-capsule" : ""}`}>
                <RotateCw className="h-8 w-8 text-secondary-foreground" />
              </div>
              {selected.totalStock <= 0 ? (
                <p className="w-full rounded-full bg-muted py-3 text-center font-extrabold text-muted-foreground">完売御礼・已完售</p>
              ) : (
              <div className="grid w-full grid-cols-2 gap-3">
                {[1, 5].map((n) => (
                  <button key={n} disabled={spinning || selected.totalStock < n} onClick={() => draw(n)} className="rounded-full bg-primary py-3 font-extrabold text-primary-foreground shadow-md transition active:scale-95 disabled:opacity-50">
                    {n === 1 ? "單抽" : "五連抽"}<span className="block text-xs font-normal">{selected.totalStock < n ? "剩餘不足" : `NT$${selected.price * n}`}</span>
                  </button>
                ))}
              </div>
              )}
            </div>
            <div>
              <p className="mb-2 font-bold">全款式一覽</p>
              <div className="grid grid-cols-3 gap-2">
                {selected.items.map((it) => (
                  <div key={it.id} className={`relative overflow-hidden rounded-xl border border-border bg-card ${it.stock <= 0 ? "opacity-50 grayscale" : ""}`}>
                    <img src={it.image} alt={it.name} className="aspect-square w-full object-cover" />
                    {it.stock <= 0 && <span className="absolute inset-x-0 top-1/3 bg-foreground/70 py-1 text-center text-xs font-extrabold text-background">已完售</span>}
                    <p className="px-1.5 pt-1.5 text-xs">{it.name}</p>
                    <p className={`px-1.5 pb-1.5 text-[10px] font-bold ${it.stock > 0 && it.stock <= 2 ? "text-destructive" : "text-muted-foreground"}`}>剩餘 {it.stock} 顆</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "vault" && (
          <div className="space-y-4">
            <h2 className="text-lg font-extrabold">我的倉庫（{vault.length}）</h2>
            <div className="rounded-2xl border-2 border-border bg-card p-3">
              {vault.length >= FREE_SHIP_COUNT ? (
                <p className="text-sm font-extrabold text-primary">🎉 已達 {FREE_SHIP_COUNT} 顆，7-11 運費免費！</p>
              ) : (
                <p className="text-sm font-bold">🔥 已收集 {vault.length} 顆，再轉 <span className="text-primary">{FREE_SHIP_COUNT - vault.length}</span> 顆即享 7-11 免運！</p>
              )}
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, (vault.length / FREE_SHIP_COUNT) * 100)}%` }} />
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">滿 {FREE_SHIP_COUNT} 顆免運，未滿運費 NT${SHIP_FEE}</p>
              {oldest && <p className="mt-1 text-xs font-bold text-destructive">⏰ 暫存剩餘 {timeLeft(oldest)}（以最早抽到的商品計算）</p>}
            </div>
            <Rules />
            {vault.length === 0 ? <Empty text="倉庫空空的，快去轉蛋吧！" /> : (
              <>
                <div className="grid grid-cols-3 gap-2">
                  {vault.map((v) => (
                    <div key={v.vaultId} className="overflow-hidden rounded-xl border-2 border-border bg-card">
                      <img src={v.image} alt={v.name} className="aspect-square w-full object-cover" />
                      <div className="p-1.5"><p className="text-xs font-bold leading-tight">{v.name}</p><p className="text-[10px] text-muted-foreground">NT${v.price}</p></div>
                    </div>
                  ))}
                </div>
                <form onSubmit={checkout} className="space-y-3 rounded-2xl border-2 border-border bg-card p-4">
                  <p className="flex items-center gap-2 font-bold"><Truck className="h-5 w-5 text-primary" /> 7-11 取貨付款・整單出貨（共 {vault.length} 顆）</p>
                  {([["name", "收件人姓名（請填證件姓名）", "text"], ["phone", "手機號碼（09 開頭 10 碼）", "tel"], ["email", "Email", "email"]] as const).map(([k, l, t]) => (
                    <input key={k} required type={t} placeholder={l} value={ship[k]} onChange={(e) => setShip({ ...ship, [k]: e.target.value })}
                      className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
                  ))}
                  <button type="button" onClick={() => setPicker(true)} className="flex w-full items-center gap-2 rounded-xl border-2 border-dashed border-primary bg-background px-3 py-2.5 text-left text-sm">
                    <MapPin className="h-5 w-5 shrink-0 text-primary" />
                    {ship.storeCode ? <span><b>{ship.storeName}門市</b>（店號 {ship.storeCode}）<span className="block text-xs text-primary">點此更換門市</span></span> : <span className="font-bold text-primary">點此選擇 7-11 取貨門市</span>}
                  </button>
                  <div className="space-y-1 rounded-xl bg-muted p-3 text-sm">
                    <div className="flex justify-between"><span>扭蛋金額（{vault.length} 顆）</span><span>NT${sum.subtotal}</span></div>
                    <div className="flex justify-between"><span>7-11 運費</span><span>{sum.fee ? `NT$${sum.fee}` : "免運"}</span></div>
                    <div className="flex justify-between border-t border-border pt-1 font-extrabold"><span>取貨付款總金額</span><span className="text-primary">NT${sum.total}</span></div>
                  </div>
                  <p className="text-xs text-muted-foreground">📦 包裹到店後請於 7 日內取貨付款，未取件將影響日後購買資格。</p>
                  <label className="flex items-start gap-2 text-xs"><input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--primary)]" /> 我已閱讀並同意：{RULES}</label>
                  <button disabled={sending} className="w-full rounded-full bg-primary py-3 font-extrabold text-primary-foreground disabled:opacity-50">{sending ? "送出中…" : `📦 一鍵整單出貨（共 ${vault.length} 顆・NT$${sum.total}）`}</button>
                </form>
              </>
            )}
          </div>
        )}

        {tab === "orders" && (
          <div className="space-y-3">
            <h2 className="text-lg font-extrabold">我的訂單</h2>
            {orders.length === 0 ? <Empty text="尚無出貨訂單" /> : orders.map((o) => <OrderCard key={o.id} o={o} />)}
          </div>
        )}

        {tab === "admin" && <AdminGate><Admin machines={machines} reload={reloadMachines} flash={flash} /></AdminGate>}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card">
        <div className="mx-auto grid max-w-md grid-cols-3">
          {([["home", "扭蛋機台", Sparkles], ["vault", "我的倉庫", Package], ["orders", "訂單進度", ShoppingBag]] as const).map(([k, l, Icon]) => (
            <button key={k} onClick={() => { setTab(k); if (k === "home") setSelectedId(null); }}
              className={`relative flex flex-col items-center gap-0.5 py-2.5 text-xs font-bold ${tab === k ? "text-primary" : "text-muted-foreground"}`}>
              <Icon className="h-5 w-5" />{l}
              {k === "vault" && vault.length > 0 && <span className="absolute right-[30%] top-1 rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">{vault.length}</span>}
            </button>
          ))}
        </div>
      </nav>

      {menu && <SideMenu info={info} onClose={() => setMenu(false)} go={(t) => { setTab(t); setSelectedId(null); setMenu(false); }} />}

      {phase && (
        <div className="bg-overlay fixed inset-0 z-50 flex flex-col items-center justify-center p-4">
          <div className="relative flex flex-col items-center">
            {/* globe */}
            <div className={`gm-globe relative h-44 w-44 overflow-hidden rounded-full border-[6px] border-card bg-card/30 shadow-xl ${phase === "spin" ? "gm-shake" : ""}`}>
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <span key={i} className={`gm-ball absolute h-10 w-10 rounded-full border-2 border-card ${phase === "spin" ? "gm-tumble" : ""}`}
                  style={{ left: `${10 + (i % 4) * 22}%`, top: `${40 + Math.floor(i / 4) * 25}%`, animationDelay: `${i * 0.08}s`, background: `linear-gradient(180deg, var(--${["primary", "accent", "secondary", "chart-2"][i % 4]}) 50%, var(--card) 50%)` }} />
              ))}
            </div>
            {/* body */}
            <div className="-mt-3 flex h-32 w-52 flex-col items-center justify-between rounded-3xl bg-primary px-4 py-3 shadow-xl">
              <div className={`flex h-14 w-14 items-center justify-center rounded-full border-4 border-card bg-accent ${phase === "spin" ? "gm-handle" : ""}`}>
                <div className="h-2 w-10 rounded-full bg-card" />
              </div>
              <div className="h-8 w-16 rounded-t-xl bg-foreground/70" />
            </div>
            {/* capsule */}
            {phase !== "spin" && (
              <div className={`absolute bottom-[-10px] ${phase === "drop" ? "gm-drop" : "gm-burst"}`}>
                <div className="relative h-16 w-16">
                  <div className={`absolute inset-x-0 top-0 h-8 rounded-t-full border-2 border-card bg-primary ${phase === "open" ? "gm-top-open" : ""}`} />
                  <div className={`absolute inset-x-0 bottom-0 h-8 rounded-b-full border-2 border-card bg-card ${phase === "open" ? "gm-bot-open" : ""}`} />
                  {phase === "open" && <div className="gm-flash absolute inset-[-40px] rounded-full bg-accent/80 blur-xl" />}
                </div>
              </div>
            )}
          </div>
          <p className="mt-28 text-lg font-extrabold text-primary-foreground">
            {phase === "spin" ? "ガチャガチャ…🎶" : phase === "drop" ? "コロン！" : "パカッ！✨"}
          </p>
        </div>
      )}

      {result && (
        <div className="bg-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="animate-pop w-full max-w-sm rounded-3xl bg-card p-5 text-center">
            <p className="text-xl font-extrabold text-primary">🎉 おめでとう！</p>
            <p className="mb-4 text-sm text-muted-foreground">已存入倉庫</p>
            <div className="grid grid-cols-3 gap-2">
              {result.map((r, i) => (
                <div key={r.vaultId} className="animate-pop" style={{ animationDelay: `${i * 0.1}s` }}>
                  <img src={r.image} alt={r.name} className="aspect-square w-full rounded-xl object-cover" />
                  <p className="mt-1 text-xs">{r.name}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button onClick={() => setResult(null)} className="rounded-full border-2 border-primary py-2.5 font-bold text-primary">再抽一次</button>
              <button onClick={() => { setResult(null); setTab("vault"); }} className="rounded-full bg-primary py-2.5 font-bold text-primary-foreground">查看倉庫</button>
            </div>
          </div>
        </div>
      )}

      {picker && <StorePicker onClose={() => setPicker(false)} onPick={(st) => { setShip((p) => ({ ...p, storeName: st.name, storeCode: st.code })); setPicker(false); }} />}

      {toast && <div className="animate-toast fixed inset-x-4 bottom-24 z-40 mx-auto max-w-sm rounded-xl bg-foreground px-4 py-3 text-center text-sm text-background shadow-lg">{toast}</div>}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border-2 border-dashed border-border p-10 text-center text-muted-foreground">{text}</div>;
}

function OrderCard({ o, children }: { o: Order; children?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border-2 border-border bg-card p-4 text-sm">
      <div className="flex justify-between"><span className="font-extrabold">{o.id}</span><span className={`st-${o.status} rounded-full px-2.5 py-0.5 text-xs font-bold`}>{o.status}</span></div>
      <p className="text-xs text-muted-foreground">{o.createdAt}・總金額 NT${o.total}</p>
      <ul className="mt-2 divide-y divide-border rounded-xl bg-muted/60 px-3">
        {groupItems(o.items).map((g) => <li key={g.name} className="flex justify-between gap-2 py-1.5"><span>{g.name}</span><span className="shrink-0 font-bold">- {g.qty} 顆</span></li>)}
      </ul>
      <p className="mt-1 text-xs text-muted-foreground">7-11 {o.shipping.storeName}（{o.shipping.storeCode}）・{o.shipping.name} {o.shipping.phone}</p>
      {children}
    </div>
  );
}

function Admin({ machines, reload, flash }: { machines: Machine[]; reload: () => void; flash: (m: string) => void }) {
  const [view, setView] = useState<"machines" | "orders" | "seller" | "shop">("machines");
  const [edit, setEdit] = useState<Machine | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ostat, setOstat] = useState("待出貨");
  const getOrders = useServerFn(adminOrders);
  const setStatus = useServerFn(adminSetOrderStatus);
  const saveM = useServerFn(adminSaveMachine);
  const delM = useServerFn(adminDeleteMachine);
  const getSeller = useServerFn(adminGetSeller);
  const loadOrders = () => getOrders().then(setOrders).catch(() => flash("讀取訂單失敗"));
  useEffect(() => { loadOrders(); }, []);
  const field = "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm";

  const save = async () => {
    if (!edit) return;
    if (!edit.title.trim()) return flash("請輸入名稱");
    try { await saveM({ data: edit }); } catch { return flash("儲存失敗"); }
    setEdit(null); reload(); flash("已儲存");
  };

  const exportCsv = async () => {
    const list = orders.filter((o) => o.status === "待出貨");
    if (!list.length) return flash("沒有待出貨訂單");
    let seller: Seller;
    try { seller = await getSeller(); } catch { return flash("讀取賣家資料失敗"); }
    if (missingSeller(seller).length) { setView("seller"); return flash("請先完整填寫賣家寄件與收款資料"); }
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.aoa_to_sheet(build711Rows(list, seller));
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 17 } }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "工作表1");
    XLSX.writeFile(wb, `一般交貨便-取貨付款_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  if (edit) return (
    <div className="space-y-3">
      <button onClick={() => setEdit(null)} className="flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" /> 返回</button>
      <h2 className="text-lg font-extrabold">編輯扭蛋機</h2>
      <input className={field} placeholder="名稱" value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} />
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs">單價<input type="number" className={field} value={edit.price} onChange={(e) => setEdit({ ...edit, price: +e.target.value })} /></label>
        <div className="text-xs">總庫存（自動加總）<p className="rounded-xl bg-muted px-3 py-2 text-sm font-bold">{edit.items.reduce((a, i) => a + (Number(i.stock) || 0), 0)} 顆</p></div>
      </div>
      <input className={field} placeholder="狀態標籤" value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })} />
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-2">
        {edit.coverImage ? <img src={edit.coverImage} alt="" className="h-16 w-16 rounded-lg object-cover" /> : <div className="h-16 w-16 rounded-lg bg-muted" />}
        <ImageUpload label="上傳機台封面" flash={flash} onDone={(url) => setEdit((e) => e && { ...e, coverImage: url })} />
      </div>
      <p className="pt-2 font-bold">商品款式（{edit.items.length}）・每款各自設定顆數</p>
      {edit.items.map((it, idx) => {
        const up = (p: Partial<typeof it>) => setEdit({ ...edit, items: edit.items.map((x, j) => (j === idx ? { ...x, ...p } : x)) });
        return (
        <div key={it.id} className="flex gap-2 rounded-xl border border-border bg-card p-2">
          <img src={it.image} alt="" className="h-14 w-14 rounded-lg bg-muted object-cover" />
          <div className="flex-1 space-y-1">
            <input className={field} placeholder="商品名稱" value={it.name} onChange={(e) => up({ name: e.target.value })} />
            <ImageUpload label="上傳款式照片" flash={flash} onDone={(url) => setEdit((e) => e && { ...e, items: e.items.map((x) => (x.id === it.id ? { ...x, image: url } : x)) })} />
            <label className="flex items-center gap-2 text-xs">此款庫存<input type="number" min={0} className={field} value={it.stock} onChange={(e) => up({ stock: Math.max(0, +e.target.value) })} />顆</label>
          </div>
          <button onClick={() => setEdit({ ...edit, items: edit.items.filter((_, j) => j !== idx) })} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
        </div>
      ); })}
      <button onClick={() => setEdit({ ...edit, items: [...edit.items, { id: "i" + Date.now() + Math.random().toString(36).slice(2, 6), name: "", image: "", stock: 5 }] })} className="flex w-full items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border py-2 text-sm"><Plus className="h-4 w-4" /> 新增商品</button>
      <button onClick={save} className="flex w-full items-center justify-center gap-1 rounded-full bg-primary py-3 font-extrabold text-primary-foreground"><Check className="h-4 w-4" /> 儲存</button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 rounded-full bg-muted p-1 text-xs font-bold">
        {(["machines", "orders", "seller", "shop"] as const).map((v) => (
          <button key={v} onClick={() => setView(v)} className={`rounded-full py-2 ${view === v ? "bg-card text-primary shadow" : "text-muted-foreground"}`}>
            {v === "machines" ? "扭蛋機" : v === "orders" ? `訂單` : v === "seller" ? "賣家設定" : "商店公告"}
          </button>
        ))}
      </div>
      {view === "shop" ? <ShopInfoForm flash={flash} /> : view === "seller" ? <SellerForm flash={flash} /> : view === "machines" ? (
        <>
          <button onClick={() => setEdit({ id: "m" + Date.now(), title: "", price: 100, totalStock: 0, setPrice: 0, coverImage: "", status: "熱烈販售中", items: [] })}
            className="flex w-full items-center justify-center gap-1 rounded-full bg-primary py-2.5 font-bold text-primary-foreground"><Plus className="h-4 w-4" /> 新增扭蛋機</button>
          {machines.map((m) => (
            <div key={m.id} className="flex items-center gap-3 rounded-2xl border-2 border-border bg-card p-2">
              <img src={m.coverImage} alt="" className="h-14 w-14 rounded-xl bg-muted object-cover" />
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{m.title}</p><p className="text-xs text-muted-foreground">NT${m.price}・庫存 {m.totalStock}・{m.items.length} 款</p></div>
              <button onClick={() => setEdit(m)} className="p-2 text-muted-foreground"><Edit3 className="h-4 w-4" /></button>
              <button onClick={async () => { if (confirm("確定刪除？")) { await delM({ data: { id: m.id } }); reload(); } }} className="p-2 text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </>
      ) : (
        <>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <button onClick={exportCsv} className="flex items-center justify-center gap-1 rounded-full bg-primary py-2.5 font-bold text-primary-foreground"><Download className="h-4 w-4" /> 匯出 7-11 賣貨便 Excel</button>
            <button onClick={loadOrders} aria-label="重新整理" className="rounded-full bg-muted px-3 text-muted-foreground"><RefreshCw className="h-4 w-4" /></button>
          </div>
          <p className="text-center text-xs text-muted-foreground">依官方「一般交貨便-取貨付款」範本匯出所有「待出貨」訂單</p>
          <div className="grid grid-cols-5 gap-1 text-xs font-bold">
            {[...ORDER_STATUSES, "全部"].map((s) => {
              const n = s === "全部" ? orders.length : orders.filter((o) => o.status === s).length;
              return <button key={s} onClick={() => setOstat(s)} className={`rounded-full py-1.5 ${ostat === s ? (s === "全部" ? "bg-foreground text-background" : `st-${s}`) : "bg-muted text-muted-foreground"} ${ostat === s ? "ring-2 ring-ring/40" : ""}`}>{s}({n})</button>;
            })}
          </div>
          {(() => { const list = ostat === "全部" ? orders : orders.filter((o) => o.status === ostat); return list.length === 0 ? <Empty text={`沒有「${ostat}」訂單`} /> : list.map((o) => (
            <OrderCard key={o.id} o={o}>
              <div className="mt-3 flex flex-wrap gap-1">
                {ORDER_STATUSES.map((s) => (
                  <button key={s} onClick={async () => { setOrders((p) => p.map((x) => (x.id === o.id ? { ...x, status: s } : x))); await setStatus({ data: { id: o.id, status: s } }).catch(() => flash("更新失敗")); }}
                    className={`rounded-full px-3 py-1 text-xs font-bold ${o.status === s ? `st-${s}` : "bg-muted text-muted-foreground"}`}>{s}</button>
                ))}
              </div>
            </OrderCard>
          )); })()}
        </>
      )}
    </div>
  );
}

function AdminGate({ children }: { children: React.ReactNode }) {
  const check = useServerFn(checkAdmin);
  const unlock = useServerFn(unlockAdmin);
  const lock = useServerFn(lockAdmin);
  const [state, setState] = useState<"loading" | "locked" | "open">("loading");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => { check().then((r) => setState(r.ok ? "open" : "locked")).catch(() => setState("locked")); }, []);
  if (state === "loading") return <p className="py-10 text-center text-sm text-muted-foreground">載入中…</p>;
  if (state === "open") return (
    <div>
      <div className="mb-3 flex justify-end">
        <button onClick={async () => { await lock(); setState("locked"); }} className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">登出後台</button>
      </div>
      {children}
    </div>
  );
  return (
    <form onSubmit={async (e) => { e.preventDefault(); setBusy(true); setErr(false);
        const r = await unlock({ data: { password: pw } }).catch(() => ({ ok: false }));
        setBusy(false); if (r.ok) { setPw(""); setState("open"); } else setErr(true); }}
      className="mx-auto mt-8 max-w-xs space-y-3 rounded-2xl border-2 border-border bg-card p-5 text-center">
      <Settings className="mx-auto h-8 w-8 text-primary" />
      <p className="font-extrabold">管理者後台</p>
      <input type="password" autoComplete="current-password" placeholder="請輸入後台密碼" value={pw} onChange={(e) => setPw(e.target.value)}
        className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm" />
      {err && <p className="text-xs text-destructive">密碼錯誤</p>}
      <button disabled={busy || !pw} className="w-full rounded-full bg-primary py-2.5 font-bold text-primary-foreground disabled:opacity-50">進入後台</button>
    </form>
  );
}

const SELLER_FIELDS: [keyof Seller, string][] = [
  ["senderName", "寄件人姓名"], ["senderPhone", "寄件人電話"], ["senderEmail", "寄件人 Email"],
  ["accountName", "收款帳戶名稱"], ["bankCode", "金融機構代碼（例：822）"], ["branchCode", "分行代碼（7 碼）"],
  ["accountNo", "銀行帳號"], ["idNo", "開戶身分證字號／統編"],
];

function SellerForm({ flash }: { flash: (m: string) => void }) {
  const get = useServerFn(adminGetSeller);
  const save = useServerFn(adminSaveSeller);
  const [s, setS] = useState<Seller>(emptySeller);
  const [busy, setBusy] = useState(false);
  useEffect(() => { get().then(setS).catch(() => flash("讀取失敗")); }, []);
  const field = "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm";
  return (
    <form className="space-y-2 rounded-2xl border-2 border-border bg-card p-4" onSubmit={async (e) => {
      e.preventDefault(); setBusy(true);
      try { await save({ data: s }); flash("已儲存賣家資料"); } catch { flash("儲存失敗"); }
      setBusy(false);
    }}>
      <p className="font-bold">賣家寄件與收款資料</p>
      <p className="text-xs text-muted-foreground">匯出 7-11 檔案時會自動填入每一筆訂單，僅後台可見。</p>
      {SELLER_FIELDS.map(([k, l]) => (
        <label key={k} className="block text-xs">{l}<input className={field} value={s[k]} onChange={(e) => setS({ ...s, [k]: e.target.value })} /></label>
      ))}
      <label className="block text-xs">開戶身分類型
        <select className={field} value={s.accountType} onChange={(e) => setS({ ...s, accountType: e.target.value as Seller["accountType"] })}>
          <option>個人戶</option><option>商業戶</option>
        </select>
      </label>
      <button disabled={busy} className="w-full rounded-full bg-primary py-2.5 font-bold text-primary-foreground disabled:opacity-50">{busy ? "儲存中…" : "儲存"}</button>
    </form>
  );
}

function StorePicker({ onPick, onClose }: { onPick: (s: Store) => void; onClose: () => void }) {
  const towns = useServerFn(getTowns);
  const search = useServerFn(searchStores);
  const [city, setCity] = useState("");
  const [townList, setTownList] = useState<string[]>([]);
  const [town, setTown] = useState("");
  const [q, setQ] = useState("");
  const [list, setList] = useState<Store[] | null>(null);
  const [busy, setBusy] = useState(false);
  const cityName = CITIES.find(([id]) => id === city)?.[1] ?? "";
  const run = async (t = town) => {
    if (!q.trim() && !(cityName && t)) return;
    setBusy(true);
    try { setList(await search({ data: { q, city: cityName, town: t } })); } catch { setList([]); }
    setBusy(false);
  };
  const field = "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm";
  return (
    <div className="bg-overlay fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="flex max-h-[85vh] w-full max-w-md flex-col rounded-t-3xl bg-card p-4 sm:rounded-3xl">
        <div className="mb-3 flex items-center justify-between">
          <p className="flex items-center gap-1 font-extrabold"><MapPin className="h-5 w-5 text-primary" /> 選擇 7-11 取貨門市</p>
          <button onClick={onClose} aria-label="關閉"><X className="h-5 w-5" /></button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <select aria-label="縣市" className={field} value={city} onChange={async (e) => {
            setCity(e.target.value); setTown(""); setTownList([]);
            if (e.target.value) setTownList(await towns({ data: { cityId: e.target.value } }).catch(() => []));
          }}>
            <option value="">選擇縣市</option>
            {CITIES.map(([id, n]) => <option key={id} value={id}>{n}</option>)}
          </select>
          <select aria-label="鄉鎮區" className={field} value={town} disabled={!townList.length} onChange={(e) => { setTown(e.target.value); run(e.target.value); }}>
            <option value="">選擇區域</option>
            {townList.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); run(); }}>
          <input className={field} placeholder="門市名稱、路名或 6 碼店號" value={q} onChange={(e) => setQ(e.target.value)} />
          <button aria-label="搜尋" className="rounded-xl bg-primary px-3 text-primary-foreground"><Search className="h-4 w-4" /></button>
        </form>
        <div className="mt-3 flex-1 space-y-2 overflow-y-auto">
          {busy && <p className="py-6 text-center text-sm text-muted-foreground">搜尋中…</p>}
          {!busy && list?.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">找不到門市，請換個關鍵字</p>}
          {!busy && !list && <p className="py-6 text-center text-xs text-muted-foreground">選擇縣市與區域，或直接輸入門市名稱／店號</p>}
          {!busy && list?.map((s) => (
            <button key={s.code} onClick={() => onPick(s)} className="w-full rounded-xl border border-border p-3 text-left active:bg-muted">
              <p className="text-sm font-bold">{s.name}門市 <span className="text-xs font-normal text-muted-foreground">店號 {s.code}</span></p>
              <p className="text-xs text-muted-foreground">{s.address}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Rules() {
  return (
    <div className="flex gap-2 rounded-2xl border-2 border-destructive/40 bg-destructive/10 p-3 text-xs font-bold leading-relaxed">
      <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
      <p>{RULES}</p>
    </div>
  );
}

async function shrink(file: File): Promise<{ base64: string; type: string }> {
  const img = await createImageBitmap(file);
  const max = 1200, k = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  const url = c.toDataURL("image/jpeg", 0.85);
  return { base64: url.split(",")[1] ?? "", type: "image/jpeg" };
}

function ImageUpload({ label, onDone, flash }: { label: string; onDone: (url: string) => void; flash: (m: string) => void }) {
  const up = useServerFn(adminUploadImage);
  const [busy, setBusy] = useState(false);
  return (
    <label className={`inline-flex cursor-pointer items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-bold text-secondary-foreground ${busy ? "opacity-50" : ""}`}>
      <Upload className="h-3.5 w-3.5" />{busy ? "上傳中…" : label}
      <input type="file" accept="image/*" className="hidden" disabled={busy} onChange={async (e) => {
        const f = e.target.files?.[0]; e.target.value = ""; if (!f) return;
        setBusy(true);
        try { const r = await up({ data: await shrink(f) }); onDone(r.url); flash("圖片已上傳，記得按儲存"); } catch { flash("上傳失敗，請重新登入後台再試"); }
        setBusy(false);
      }} />
    </label>
  );
}

function ShopInfoForm({ flash }: { flash: (m: string) => void }) {
  const get = useServerFn(getShopInfo);
  const save = useServerFn(adminSaveShopInfo);
  const [s, setS] = useState<ShopInfo>(emptyShopInfo);
  useEffect(() => { get().then(setS).catch(() => flash("讀取失敗")); }, []);
  const field = "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm";
  const F: [keyof ShopInfo, string][] = [["lineUrl", "官方 LINE 連結（https://lin.ee/...）"], ["igUrl", "Instagram 連結（https://instagram.com/...）"], ["serviceHours", "客服時間（例：每日 10:00–22:00）"], ["contactEmail", "客服 Email"]];
  return (
    <form className="space-y-2 rounded-2xl border-2 border-border bg-card p-4" onSubmit={async (e) => {
      e.preventDefault();
      try { await save({ data: s }); flash("已更新，所有顧客立即看到"); } catch (err) { flash(err instanceof Error && err.message.includes("https") ? "連結需以 https:// 開頭" : "儲存失敗"); }
    }}>
      <p className="font-bold">商店與公告設定</p>
      <label className="block text-xs">跑馬燈公告<textarea rows={3} className={field} value={s.marquee} onChange={(e) => setS({ ...s, marquee: e.target.value })} /></label>
      {F.map(([k, l]) => <label key={k} className="block text-xs">{l}<input className={field} value={s[k]} onChange={(e) => setS({ ...s, [k]: e.target.value })} /></label>)}
      <button className="w-full rounded-full bg-primary py-2.5 font-bold text-primary-foreground">儲存</button>
    </form>
  );
}

function SideMenu({ info, onClose, go }: { info: ShopInfo; onClose: () => void; go: (t: "home" | "vault" | "orders" | "admin") => void }) {
  const [open, setOpen] = useState<string | null>("guide");
  const Sec = ({ id, icon: Icon, title, children }: { id: string; icon: typeof BookOpen; title: string; children: React.ReactNode }) => (
    <div className="rounded-2xl border border-border bg-card">
      <button onClick={() => setOpen(open === id ? null : id)} className="flex w-full items-center gap-2 p-3 text-left text-sm font-extrabold"><Icon className="h-4 w-4 text-primary" />{title}</button>
      {open === id && <div className="space-y-1.5 px-3 pb-3 text-xs leading-relaxed text-muted-foreground">{children}</div>}
    </div>
  );
  return (
    <div className="bg-overlay fixed inset-0 z-40" onClick={onClose}>
      <aside onClick={(e) => e.stopPropagation()} className="animate-drawer absolute inset-y-0 right-0 flex w-[85%] max-w-sm flex-col gap-3 overflow-y-auto bg-background p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <img src={catLogo} alt="" width={48} height={48} className="h-12 w-12 rounded-full bg-card p-0.5" />
            <div><p className="font-extrabold">クリームキャット ガチャ屋</p><p className="text-xs text-muted-foreground">在台灣也能享受日本扭蛋的驚喜</p></div>
          </div>
          <button onClick={onClose} aria-label="關閉"><X className="h-5 w-5" /></button>
        </div>
        <Sec id="guide" icon={BookOpen} title="新手玩法 3 步驟">
          <p>① 挑選喜歡的扭蛋機，單抽或五連抽。</p>
          <p>② 抽到的扭蛋自動放進「我的倉庫」，免費暫存 {VAULT_HOURS} 小時。</p>
          <p>③ 申請出貨、選擇 7-11 門市，貨到付款寄到你身邊。</p>
        </Sec>
        <Sec id="ship" icon={Truck} title="運費與寄送說明">
          <p>單筆訂單滿 {FREE_SHIP_COUNT} 顆免運；未滿 {FREE_SHIP_COUNT} 顆運費 NT${SHIP_FEE}。</p>
          <p>{RULES}</p>
        </Sec>
        <Sec id="safe" icon={ShieldCheck} title="安心購物保證">
          <p>✅ 7-11 取貨付款：到門市取件時才付款，不需事先轉帳。</p>
          <p>✅ 每款扭蛋庫存即時同步，抽中即保留，不會超賣。</p>
          <p>⚠️ 本店不會主動要求您轉帳、提供信用卡或 ATM 操作，如遇可疑訊息請透過官方 LINE 確認。</p>
          <p>因隨機商品性質，恕不接受個人因素之退換貨或取消。</p>
        </Sec>
        <div className="grid grid-cols-2 gap-2">
          {info.lineUrl && <a href={info.lineUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1 rounded-full bg-secondary py-2.5 text-sm font-bold text-secondary-foreground"><MessageCircle className="h-4 w-4" />LINE 客服</a>}
          {info.igUrl && <a href={info.igUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1 rounded-full bg-accent py-2.5 text-sm font-bold text-accent-foreground"><Instagram className="h-4 w-4" />Instagram</a>}
        </div>
        {(info.serviceHours || info.contactEmail) && <p className="text-center text-xs text-muted-foreground">{info.serviceHours}{info.serviceHours && info.contactEmail ? "・" : ""}{info.contactEmail}</p>}
        <div className="mt-auto border-t border-border pt-3 text-center">
          <button onClick={() => go("admin")} className="inline-flex items-center gap-1 text-[11px] text-muted-foreground"><Lock className="h-3 w-3" />店家管理登入</button>
        </div>
      </aside>
    </div>
  );
}
