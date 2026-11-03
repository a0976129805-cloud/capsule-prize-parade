import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { checkAdmin, unlockAdmin, lockAdmin } from "@/lib/admin-gate.functions";
import {
  listMachines, drawPrizes, createOrder, myOrders, adminOrders, adminSetOrderStatus, adminSaveMachine, adminDeleteMachine,
  type Machine, type VaultItem, type Shipping, type Order,
} from "@/lib/gacha.functions";
import { ordersToCsv } from "@/lib/csv";
import { supabase } from "@/integrations/supabase/client";
import catLogo from "@/assets/cat-logo.png";
import {
  Sparkles, Package, ShoppingBag, Settings, RotateCw, CheckCircle2, ArrowLeft,
  Plus, Trash2, Edit3, Check, Truck, Download, RefreshCw,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "奶油貓貓 ガチャ扭蛋屋｜線上扭蛋・7-11 賣貨便寄送" },
      { name: "description", content: "奶油貓貓的日系線上扭蛋屋，手機就能轉蛋，抽中商品存入倉庫，7-11 賣貨便貨到付款。" },
      { property: "og:title", content: "奶油貓貓 ガチャ扭蛋屋" },
      { property: "og:description", content: "線上轉蛋、倉庫收藏、7-11 賣貨便貨到付款寄送。" },
    ],
  }),
  component: App,
});

const ORDER_STATUSES = ["待出貨", "已出貨", "已取貨", "已取消"];
const STORAGE = "gacha-vault-v2";
const emptyShip: Shipping = { name: "", phone: "", storeName: "", storeCode: "" };

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
  const [picked, setPicked] = useState<string[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<VaultItem[] | null>(null);
  const [phase, setPhase] = useState<null | "spin" | "drop" | "open">(null);
  const [ship, setShip] = useState<Shipping>(emptyShip);
  const [toast, setToast] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const fetchMachines = useServerFn(listMachines);
  const doDraw = useServerFn(drawPrizes);
  const doOrder = useServerFn(createOrder);
  const fetchMine = useServerFn(myOrders);

  const reloadMachines = () => fetchMachines().then(setMachines).catch(() => {});
  const reloadOrders = () => fetchMine({ data: { deviceId: getDeviceId() } }).then(setOrders).catch(() => {});

  useEffect(() => {
    try { const s = JSON.parse(localStorage.getItem(STORAGE) || "null"); if (Array.isArray(s)) setVault(s); } catch {}
    setLoaded(true);
    reloadMachines(); reloadOrders();
    const ch = supabase.channel(`gacha-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => reloadMachines())
      .on("postgres_changes", { event: "*", schema: "public", table: "prizes" }, () => reloadMachines())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);
  useEffect(() => { if (loaded) localStorage.setItem(STORAGE, JSON.stringify(vault)); }, [vault, loaded]);

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2500); };
  const selected = machines.find((m) => m.id === selectedId) || null;

  const draw = async (count: number) => {
    if (!selected || selected.totalStock < count || selected.items.length === 0) return flash("庫存不足！");
    setSpinning(true);
    setPhase("spin");
    const req = doDraw({ data: { machineId: selected.id, count } }).catch(() => ({ ok: false as const, error: "連線失敗，請再試一次" }));
    const t1 = setTimeout(() => setPhase("drop"), 1600);
    const t2 = setTimeout(() => setPhase("open"), 2500);
    const [r] = await Promise.all([req, new Promise((res) => setTimeout(res, 3200))]);
    if (!r.ok) { clearTimeout(t1); clearTimeout(t2); setSpinning(false); setPhase(null); reloadMachines(); return flash(r.error); }
    const drawn: VaultItem[] = r.items.map((it) => ({ ...it, vaultId: Date.now() + Math.random().toString(36).slice(2), machineTitle: selected.title, price: selected.price, drawnAt: new Date().toLocaleDateString() }));
    setVault((p) => [...p, ...drawn]);
    reloadMachines();
    setSpinning(false);
    setPhase(null);
    setResult(drawn);
  };

  const checkout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (picked.length === 0) return flash("請先選擇要寄出的商品！");
    try {
      await doOrder({ data: { deviceId: getDeviceId(), items: vault.filter((v) => picked.includes(v.vaultId)), shipping: { ...ship } } });
    } catch { return flash("送出失敗，請再試一次"); }
    setVault((p) => p.filter((v) => !picked.includes(v.vaultId)));
    setPicked([]); setShip(emptyShip);
    await reloadOrders();
    flash("🎉 出貨申請已送出！");
    setTab("orders");
  };

  return (
    <div className="min-h-screen pb-24 text-foreground">
      <header className="sticky top-0 z-30 bg-primary text-primary-foreground shadow-md">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 font-extrabold">
            <Sparkles className="h-5 w-5" /> ガチャ扭蛋屋
          </div>
          <div className="flex items-center gap-1 rounded-full bg-primary-foreground/20 px-3 py-1 text-xs">
            <User className="h-3.5 w-3.5" /> 徐詠竣
          </div>
        </div>
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
              <div className="grid w-full grid-cols-2 gap-3">
                {[1, 5].map((n) => (
                  <button key={n} disabled={spinning} onClick={() => draw(n)} className="rounded-full bg-primary py-3 font-extrabold text-primary-foreground shadow-md transition active:scale-95 disabled:opacity-50">
                    {n === 1 ? "單抽" : "五連抽"}<span className="block text-xs font-normal">NT${selected.price * n}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 font-bold">商品一覽</p>
              <div className="grid grid-cols-3 gap-2">
                {selected.items.map((it) => (
                  <div key={it.id} className="overflow-hidden rounded-xl border border-border bg-card">
                    <img src={it.image} alt={it.name} className="aspect-square w-full object-cover" />
                    <p className="p-1.5 text-xs">{it.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "vault" && (
          <div className="space-y-4">
            <h2 className="text-lg font-extrabold">我的倉庫（{vault.length}）</h2>
            {vault.length === 0 ? <Empty text="倉庫空空的，快去轉蛋吧！" /> : (
              <>
                <div className="flex justify-end">
                  <button onClick={() => setPicked(picked.length === vault.length ? [] : vault.map((v) => v.vaultId))} className="text-sm font-bold text-primary">
                    {picked.length === vault.length ? "取消全選" : "全選"}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {vault.map((v) => {
                    const on = picked.includes(v.vaultId);
                    return (
                      <button key={v.vaultId} onClick={() => setPicked((p) => (on ? p.filter((x) => x !== v.vaultId) : [...p, v.vaultId]))}
                        className={`relative overflow-hidden rounded-xl border-2 bg-card text-left ${on ? "border-primary" : "border-border"}`}>
                        <img src={v.image} alt={v.name} className="aspect-square w-full object-cover" />
                        {on && <CheckCircle2 className="absolute right-2 top-2 h-6 w-6 rounded-full bg-card text-primary" />}
                        <div className="p-2"><p className="text-sm font-bold">{v.name}</p><p className="text-xs text-muted-foreground">{v.drawnAt}</p></div>
                      </button>
                    );
                  })}
                </div>
                <form onSubmit={checkout} className="space-y-3 rounded-2xl border-2 border-border bg-card p-4">
                  <p className="flex items-center gap-2 font-bold"><Truck className="h-5 w-5 text-primary" /> 7-11 賣貨便 貨到付款（已選 {picked.length} 件）</p>
                  {([["name", "收件人姓名"], ["phone", "手機號碼"], ["storeName", "取貨門市名稱"], ["storeCode", "門市店號"]] as const).map(([k, l]) => (
                    <input key={k} required placeholder={l} value={ship[k]} onChange={(e) => setShip({ ...ship, [k]: e.target.value })}
                      className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
                  ))}
                  <button className="w-full rounded-full bg-primary py-3 font-extrabold text-primary-foreground">申請出貨</button>
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

        {tab === "admin" && <AdminGate><Admin machines={machines} setMachines={setMachines} orders={orders} setOrders={setOrders} flash={flash} /></AdminGate>}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card">
        <div className="mx-auto grid max-w-md grid-cols-4">
          {([["home", "轉蛋", Sparkles], ["vault", "倉庫", Package], ["orders", "訂單", ShoppingBag], ["admin", "後台", Settings]] as const).map(([k, l, Icon]) => (
            <button key={k} onClick={() => { setTab(k); if (k === "home") setSelectedId(null); }}
              className={`relative flex flex-col items-center gap-0.5 py-2.5 text-xs font-bold ${tab === k ? "text-primary" : "text-muted-foreground"}`}>
              <Icon className="h-5 w-5" />{l}
              {k === "vault" && vault.length > 0 && <span className="absolute right-[30%] top-1 rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">{vault.length}</span>}
            </button>
          ))}
        </div>
      </nav>

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
      <div className="flex justify-between"><span className="font-extrabold">{o.id}</span><span className="rounded-full bg-secondary px-2 text-xs font-bold text-secondary-foreground">{o.status}</span></div>
      <p className="text-xs text-muted-foreground">{o.createdAt}・{o.user}</p>
      <p className="mt-2">{o.items.map((i) => i.name).join("、")}</p>
      <p className="mt-1 text-xs text-muted-foreground">7-11 {o.shipping.storeName}（{o.shipping.storeCode}）・{o.shipping.name} {o.shipping.phone}</p>
      {children}
    </div>
  );
}

function Admin({ machines, setMachines, orders, setOrders, flash }: {
  machines: Machine[]; setMachines: React.Dispatch<React.SetStateAction<Machine[]>>;
  orders: Order[]; setOrders: React.Dispatch<React.SetStateAction<Order[]>>; flash: (m: string) => void;
}) {
  const [view, setView] = useState<"machines" | "orders">("machines");
  const [edit, setEdit] = useState<Machine | null>(null);
  const field = "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm";

  const save = () => {
    if (!edit) return;
    if (!edit.title.trim()) return flash("請輸入名稱");
    setMachines((p) => (p.some((m) => m.id === edit.id) ? p.map((m) => (m.id === edit.id ? edit : m)) : [...p, edit]));
    setEdit(null); flash("已儲存");
  };

  if (edit) return (
    <div className="space-y-3">
      <button onClick={() => setEdit(null)} className="flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" /> 返回</button>
      <h2 className="text-lg font-extrabold">編輯扭蛋機</h2>
      <input className={field} placeholder="名稱" value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} />
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs">單價<input type="number" className={field} value={edit.price} onChange={(e) => setEdit({ ...edit, price: +e.target.value })} /></label>
        <label className="text-xs">庫存<input type="number" className={field} value={edit.totalStock} onChange={(e) => setEdit({ ...edit, totalStock: +e.target.value })} /></label>
      </div>
      <input className={field} placeholder="狀態標籤" value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })} />
      <input className={field} placeholder="封面圖片網址" value={edit.coverImage} onChange={(e) => setEdit({ ...edit, coverImage: e.target.value })} />
      <p className="pt-2 font-bold">商品（{edit.items.length}）</p>
      {edit.items.map((it, idx) => (
        <div key={it.id} className="flex gap-2 rounded-xl border border-border bg-card p-2">
          <img src={it.image} alt="" className="h-14 w-14 rounded-lg bg-muted object-cover" />
          <div className="flex-1 space-y-1">
            <input className={field} placeholder="商品名稱" value={it.name} onChange={(e) => setEdit({ ...edit, items: edit.items.map((x, j) => (j === idx ? { ...x, name: e.target.value } : x)) })} />
            <input className={field} placeholder="圖片網址" value={it.image} onChange={(e) => setEdit({ ...edit, items: edit.items.map((x, j) => (j === idx ? { ...x, image: e.target.value } : x)) })} />
          </div>
          <button onClick={() => setEdit({ ...edit, items: edit.items.filter((_, j) => j !== idx) })} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
        </div>
      ))}
      <button onClick={() => setEdit({ ...edit, items: [...edit.items, { id: "i" + Date.now(), name: "", image: "" }] })} className="flex w-full items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border py-2 text-sm"><Plus className="h-4 w-4" /> 新增商品</button>
      <button onClick={save} className="flex w-full items-center justify-center gap-1 rounded-full bg-primary py-3 font-extrabold text-primary-foreground"><Check className="h-4 w-4" /> 儲存</button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 rounded-full bg-muted p-1 text-sm font-bold">
        {(["machines", "orders"] as const).map((v) => (
          <button key={v} onClick={() => setView(v)} className={`rounded-full py-2 ${view === v ? "bg-card text-primary shadow" : "text-muted-foreground"}`}>
            {v === "machines" ? "扭蛋機管理" : `訂單管理（${orders.length}）`}
          </button>
        ))}
      </div>
      {view === "machines" ? (
        <>
          <button onClick={() => setEdit({ id: "m" + Date.now(), title: "", price: 100, totalStock: 20, coverImage: "", status: "熱烈販售中", items: [] })}
            className="flex w-full items-center justify-center gap-1 rounded-full bg-primary py-2.5 font-bold text-primary-foreground"><Plus className="h-4 w-4" /> 新增扭蛋機</button>
          {machines.map((m) => (
            <div key={m.id} className="flex items-center gap-3 rounded-2xl border-2 border-border bg-card p-2">
              <img src={m.coverImage} alt="" className="h-14 w-14 rounded-xl bg-muted object-cover" />
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{m.title}</p><p className="text-xs text-muted-foreground">NT${m.price}・庫存 {m.totalStock}・{m.items.length} 款</p></div>
              <button onClick={() => setEdit(m)} className="p-2 text-muted-foreground"><Edit3 className="h-4 w-4" /></button>
              <button onClick={() => confirm("確定刪除？") && setMachines((p) => p.filter((x) => x.id !== m.id))} className="p-2 text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </>
      ) : orders.length === 0 ? <Empty text="尚無訂單" /> : orders.map((o) => (
        <OrderCard key={o.id} o={o}>
          <div className="mt-3 flex flex-wrap gap-1">
            {ORDER_STATUSES.map((s) => (
              <button key={s} onClick={() => setOrders((p) => p.map((x) => (x.id === o.id ? { ...x, status: s } : x)))}
                className={`rounded-full px-3 py-1 text-xs font-bold ${o.status === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{s}</button>
            ))}
          </div>
        </OrderCard>
      ))}
      <button onClick={() => { if (confirm("重置所有資料？")) { localStorage.removeItem("gacha-app-v1"); location.reload(); } }} className="flex w-full items-center justify-center gap-1 text-xs text-muted-foreground"><X className="h-3 w-3" /> 重置示範資料</button>
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
