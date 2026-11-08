import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { checkAdmin, unlockAdmin, lockAdmin } from "@/lib/admin-gate.functions";
import {
  listMachines, drawPrizes, createOrder, myOrders, myVault, adminOrders, adminSetOrderStatus, adminSaveMachine, adminDeleteMachine,
  adminGetSeller, adminSaveSeller, buySet,
  type Machine, type VaultItem, type Shipping, type Order,
} from "@/lib/gacha.functions";
import { searchStores, getTowns, CITIES, type Store } from "@/lib/stores.functions";
import { orderTotal, timeLeft, FREE_SHIP_AMOUNT, SHIP_FEE, VAULT_HOURS } from "@/lib/shipping";
import { emptySeller, type Seller } from "@/lib/export711";
import { supabase } from "@/integrations/supabase/client";
import { getShopInfo, adminSaveShopInfo, adminUploadImage } from "@/lib/shop.functions";
import { emptyShopInfo, groupItems, type ShopInfo } from "@/lib/shop-info";
import { Button } from "@/components/ui/button";
import { BannerCarousel, ShippingProgress, TrustStrip, SetPopup } from "@/components/boutique/storefront";
import { GachaScene, DockIcon } from "@/components/boutique/gacha-scene";
import { buildMyshipRows } from "@/lib/exportMyship";
import { DrawFeed } from '@/components/boutique/draw-feed';
import { ShareCard } from '@/components/boutique/share-card';
import { repeatDrawCount } from '@/lib/draw-results';
import { createGachaAudio, type GachaCue } from '@/lib/gacha-audio';
import { GACHA_TIMING, gachaDropDuration } from '@/lib/gacha-timing';
import { PrizeGallery } from '@/components/boutique/prize-gallery';
import { DrawResultDialog } from '@/components/boutique/draw-result-dialog';
import { MachineOrderList } from '@/components/boutique/machine-order-list';
import { RewardWallet, useWallet } from '@/components/boutique/reward-wallet';
import { RewardSettingsForm } from '@/components/boutique/reward-settings';
import { useMember } from '@/components/boutique/member-session';
import { getMemberContact } from '@/lib/member-contact.functions';
import { bestCoupon, couponDiscount, usableCoupon } from '@/lib/rewards';
import catLogo from "@/assets/cat-logo.png";
import { CatAlbum, albumQueryKey } from "@/components/boutique/cat-album";
import { cardLabel } from "@/lib/cat-cards";
import { useQueryClient } from "@tanstack/react-query";
import {
  Sparkles, Package, ShoppingBag, Settings, RotateCw, ArrowLeft,
  Plus, Trash2, Edit3, Check, Truck, Download, RefreshCw, MapPin, Search, X, AlertTriangle, Menu, Upload, MessageCircle, Instagram, BookOpen, ShieldCheck, Lock, Share2, Gift, Volume2, VolumeX, ZoomIn,
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
  component: Storefront,
});

const ORDER_STATUSES = ["待出貨", "已出貨", "已取貨", "已取消"];
const emptyShip: Shipping = { name: "", phone: "", email: "", storeName: "", storeCode: "" };
const RULES = `倉庫商品免費暫存 ${VAULT_HOURS} 小時，申請出貨時須將倉內所有扭蛋一併結帳寄出，無法單獨挑選放棄。逾期未出貨的商品將自動釋回機台。`;

function getDeviceId() {
  let id = localStorage.getItem("gacha-device");
  if (!id) { id = crypto.randomUUID(); localStorage.setItem("gacha-device", id); }
  return id;
}

export function Storefront({ initialTab = "home" }: { initialTab?: "home" | "vault" | "orders" | "sets" | "coupons" }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"home" | "vault" | "orders" | "admin" | "sets" | "coupons">(initialTab);
  const member = useMember();
  const wallet = useWallet();
  const [couponChoice,setCouponChoice]=useState('auto');
  const go = (next: 'home' | 'vault' | 'orders' | 'sets' | 'admin' | 'coupons') => {
    setSelectedId(null); setTab(next);
    if (next !== 'admin') navigate({ to: next === 'home' ? '/' : next === 'sets' ? '/sets' : next === 'vault' ? '/vault' : next === 'coupons' ? '/coupons' : '/orders' });
  };
  const [machines, setMachines] = useState<Machine[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [vault, setVault] = useState<VaultItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [setMachine, setSetMachine] = useState<Machine | null>(null);
  const [buying, setBuying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [customerStatus, setCustomerStatus] = useState("全部");
  const skipRef = useRef<(() => void) | null>(null);
  const [skipped, setSkipped] = useState(false);
  const [animationCount, setAnimationCount] = useState(1);
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);
  const [sound, setSound] = useState(false);
  const soundRef = useRef(false);
  const audioRef = useRef<ReturnType<typeof createGachaAudio> | null>(null);
  const soundCue = (cue: GachaCue, count = 1, lastOne = false) => { if (soundRef.current) audioRef.current?.play(cue, count, lastOne); };
  const toggleSound = () => {
    const next = !soundRef.current;
    soundRef.current = next; setSound(next);
    try { localStorage.setItem('gacha-sound', next ? 'on' : 'off'); } catch { /* Storage may be restricted. */ }
    if (next) { audioRef.current ??= createGachaAudio(); audioRef.current.unlock(); }
    else audioRef.current?.stop();
  };
  useEffect(() => {
    try { const enabled = localStorage.getItem('gacha-sound') === 'on'; soundRef.current = enabled; setSound(enabled); } catch { /* Default is quiet. */ }
    return () => { audioRef.current?.dispose(); skipRef.current?.(); };
  }, []);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<VaultItem[] | null>(null);
  const [newCards, setNewCards] = useState<number[]>([]);
  const [albumOpen, setAlbumOpen] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  useEffect(() => { setDeviceId(getDeviceId()); }, []);
  const [tag, setTag] = useState<"all" | "low" | "lastone" | "plenty">("all");
  const qc = useQueryClient();
  const refreshAlbum = () => { void qc.invalidateQueries({ queryKey: ['album'] }); };
  const [shareItems, setShareItems] = useState<VaultItem[] | null>(null);
  const [phase, setPhase] = useState<null | "coin" | "spin" | "drop" | "open">(null);
  const [ship, setShip] = useState<Shipping>(emptyShip);
  const readMemberContact = useServerFn(getMemberContact);
  useEffect(() => {
    if (!member.ready || !member.userId) return;
    let active = true;
    void readMemberContact().then(contact => {
      if (active) setShip(current => ({ ...current, name: current.name || contact.name, phone: current.phone || contact.phone, email: current.email || contact.email }));
    }).catch(() => {});
    return () => { active = false; };
  }, [member.ready, member.userId, readMemberContact]);
  const [agreed, setAgreed] = useState(false);
  const [picker, setPicker] = useState(false);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);
  const [info, setInfo] = useState<ShopInfo>(emptyShopInfo);
  const fetchInfo = useServerFn(getShopInfo);
  const fetchMachines = useServerFn(listMachines);
  const doSet = useServerFn(buySet);
  const doDraw = useServerFn(drawPrizes);
  const doOrder = useServerFn(createOrder);
  const fetchMine = useServerFn(myOrders);
  const fetchVault = useServerFn(myVault);

  const reloadMachines = () => fetchMachines().then((m) => { setMachines(m); setLoadError(false); }).catch(() => setLoadError(true)).finally(() => setLoading(false));
  const reloadOrders = () => fetchMine({ data: { deviceId: getDeviceId() } }).then(setOrders).catch(() => {});
  const reloadVault = () => fetchVault({ data: { deviceId: getDeviceId() } }).then(setVault).catch(() => {});

  useEffect(() => {
    reloadMachines(); reloadOrders(); reloadVault(); fetchInfo().then(setInfo).catch(() => {});
    const interval = setInterval(() => { reloadMachines(); reloadVault(); fetchInfo().then(setInfo).catch(() => {}); }, 60000);
    const ch = supabase.channel(`gacha-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => reloadMachines())
      .on("postgres_changes", { event: "*", schema: "public", table: "prizes" }, () => reloadMachines())
      .subscribe();
    return () => { clearInterval(interval); supabase.removeChannel(ch); };
  }, []);

  useEffect(() => {
    setTab(initialTab); setSelectedId(null);
  }, [initialTab]);

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2500); };
  const selected = machines.find((m) => m.id === selectedId) || null;
  const sum = orderTotal(vault.map((v) => v.price));
  const coupons=member.userId?(wallet.data?.coupons??[]):[];
  const chosenCoupon=couponChoice==='auto'?bestCoupon(coupons,sum.subtotal):coupons.find(c=>c.id===couponChoice);
  const discount=couponDiscount(chosenCoupon,sum.subtotal);
  const checkoutTotal=sum.total-discount;
  const oldest = vault[0]?.drawnAt;

  const purchaseSet = async () => {
    if (!setMachine || buying) return;
    setBuying(true);
    try {
      const r = await doSet({ data: { machineId: setMachine.id, deviceId: getDeviceId() } });
      if (!r.ok) { flash(r.error); return; }
      await reloadVault(); await reloadMachines();
      setSetMachine(null);
      setNewCards(r.cards ?? []); refreshAlbum();
      if (r.items.some((i) => i.isLastOne)) { setResult(r.items); return; }
      if (r.cards?.length) flash(`🐾 獲得貓咪收藏卡 ${cardLabel(r.cards[0]!)}！已收進卡冊`);
      go('vault');
      flash("全套已保留，請填寫收件資料完成整倉出貨");
    } catch { flash("購買失敗，請再試一次"); }
    finally { setBuying(false); }
  };

  const draw = async (count: number) => {
    if (!selected || selected.totalStock < count) return flash("庫存不足！");
    if (spinning) return;
    setSpinning(true); setSkipped(false); setAnimationCount(count);
    if (soundRef.current) { audioRef.current ??= createGachaAudio(); audioRef.current.unlock(); }
    audioRef.current?.stop();
    soundCue('coin');
    setPhase("coin");
    const req = doDraw({ data: { machineId: selected.id, count, deviceId: getDeviceId() } }).catch(() => ({ ok: false as const, error: "連線失敗，請再試一次" }));
    const dropAt = GACHA_TIMING.coinMs + GACHA_TIMING.turnMs;
    const openAt = dropAt + gachaDropDuration(count);
    const t0 = setTimeout(() => { setPhase("spin"); soundCue('turn'); }, GACHA_TIMING.coinMs);
    const t1 = setTimeout(() => { setPhase("drop"); soundCue('drop', count); }, dropAt);
    const t2 = setTimeout(() => { setPhase("open"); soundCue('open', count); }, openAt);
    const animation = new Promise<void>((resolve) => {
      const t3 = setTimeout(resolve, openAt + GACHA_TIMING.openMs + (count - 1) * GACHA_TIMING.capsuleStepMs);
      skipRef.current = () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); audioRef.current?.stop(); setSkipped(true); resolve(); };
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) skipRef.current();
    });
    const [r] = await Promise.all([req, animation]);
    clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); skipRef.current = null;
    if (!r.ok) { audioRef.current?.stop(); setSpinning(false); setPhase(null); reloadMachines(); return flash(r.error); }
    setVault((p) => [...p, ...r.items]);
    reloadMachines();
    setSpinning(false);
    setPhase(null);
    audioRef.current?.stop();
    soundCue('reveal', count, r.items.some((item) => item.isLastOne));
    setNewCards(r.cards ?? []); refreshAlbum();
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
      await doOrder({ data: { deviceId: getDeviceId(), shipping: { ...ship }, agreed, ...(discount&&chosenCoupon?{couponId:chosenCoupon.id}:{}) } });
      await wallet.refetch();
    } catch { setSending(false); return flash("送出失敗，請確認資料後再試一次"); }
    setSending(false);
    setVault([]); setShip(emptyShip); setAgreed(false);setCouponChoice('auto');
    await reloadOrders();
    flash("🎉 出貨申請已送出！");
    go('orders');
  };

  return (
    <div className="min-h-screen pb-24 text-foreground">
      <header className="sticky top-0 z-30 bg-primary text-primary-foreground shadow-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-2">
          <Button variant="bare" size="bare" onClick={() => go('home')} className="flex items-center gap-2 font-bold">
            <img src={catLogo} alt="クリームキャット" width={40} height={40} className="h-10 w-10 rounded-full bg-card object-contain p-0.5" />
            <span className="text-left"><span className="block text-sm font-bold">奶油貓 扭蛋屋</span><span className="block text-[10px] font-medium">クリームキャット ガチャ屋</span></span>
          </Button>
          <div className="flex items-center gap-1"><Button variant="bare" size="bare" onClick={toggleSound} aria-label={sound ? '關閉扭蛋音效' : '開啟扭蛋音效'} aria-pressed={sound} title={sound ? '關閉扭蛋音效' : '開啟扭蛋音效'} className="rounded-full p-2 hover:bg-primary-foreground/15">{sound ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}</Button><Button variant="bare" size="bare" onClick={() => setMenu(true)} aria-label="選單" className="rounded-full p-2 hover:bg-primary-foreground/15"><Menu className="h-6 w-6" /></Button></div>
        </div>
        {info.marquee && <div className="overflow-hidden bg-accent py-1 text-xs font-bold text-accent-foreground"><div className="animate-marquee">📢 {info.marquee}</div></div>}
      </header>

      <main className="mx-auto max-w-2xl px-4 py-4">
        {tab === "home" && !selected && (
          <div className="space-y-4">
            <BannerCarousel images={info.banners || []} onSets={() => go('sets')} onGuide={() => setMenu(true)} />
            <TrustStrip onDaily={() => { sessionStorage.setItem('omikuji-auto', '1'); go('coupons'); }} />
            <DrawFeed machines={machines} />
            <div className="flex items-center justify-between pt-1"><div><p className="text-xs text-secondary-foreground">今日のガチャ</p><h2 className="text-lg font-bold">今天，轉點小幸福</h2></div><Button variant="bare" size="bare" className="album-btn flex items-center gap-1.5 rounded-full py-1 pl-1 pr-3 text-xs font-bold" onClick={() => setAlbumOpen(true)}><img src={catLogo} alt="" className="h-7 w-7 rounded-full bg-card object-cover" /><span className="leading-tight">貓咪卡冊<span className="block text-[9px] font-medium">🐾 收集 50 張</span></span></Button></div>
            {machines.length > 0 && <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="tablist" aria-label="機台分類">{([["all", "全部"], ["low", "🔥 即將完售"], ["lastone", "🎁 最後賞告急"], ["plenty", "✨ 庫存充足"]] as const).map(([k, l]) => <Button key={k} role="tab" aria-selected={tag === k} size="sm" variant={tag === k ? "default" : "outline"} className="shrink-0 rounded-full" onClick={() => setTag(k)}>{l}</Button>)}</div>}
            {loading && <div className="py-8 text-center" role="status"><div className="cat-loader"><img src={catLogo} alt="" className="cat-loader-cat" /><span className="cat-loader-ball" /></div><p className="mt-2 text-sm text-muted-foreground">奶油貓正在搬機台…</p></div>}
            {loadError && <Button variant="outline" className="w-full" onClick={reloadMachines}>讀取失敗・重新載入</Button>}
            {!loading && !loadError && machines.length === 0 && <Empty text="店長正在準備新機台" />}
            <div className="grid grid-cols-2 gap-3">
            {machines.filter((m) => tag === "all" || (tag === "low" && m.totalStock > 0 && m.totalStock <= 5) || (tag === "lastone" && !!m.lastOneName && !m.lastOneAwarded && m.totalStock > 0 && m.totalStock <= 10) || (tag === "plenty" && m.totalStock > 10)).map((m) => (
              <Button variant="bare" size="bare" key={m.id} onClick={() => setSelectedId(m.id)} className="flex min-w-0 flex-col items-stretch overflow-hidden whitespace-normal rounded-lg border border-border bg-card text-left shadow-sm transition active:scale-[.97]">
                <div className="relative aspect-square bg-muted">
                  <img src={m.coverImage} alt={m.title} loading="lazy" className="h-full w-full object-cover" />
                  <span className={`absolute left-1.5 top-1.5 max-w-[calc(100%-0.75rem)] truncate rounded-full px-2 py-0.5 text-[10px] font-bold ${m.totalStock > 0 && m.totalStock <= 3 ? 'bg-destructive text-destructive-foreground motion-safe:animate-pulse' : 'bg-primary text-primary-foreground'}`}>{m.totalStock <= 0 ? "完売御礼" : m.totalStock <= 3 ? "あとわずか・即將完售" : m.totalStock <= 5 ? "残りわずか" : m.status}</span>
                  <span className="absolute bottom-1.5 right-1.5 rounded-full bg-card/90 px-2 py-0.5 text-sm font-bold text-primary">NT${m.price}</span>
                </div>
                <div className="w-full min-w-0 p-2 text-left">
                  <p className="line-clamp-2 min-h-[2.5em] whitespace-normal break-words text-xs font-bold leading-[1.25]" title={m.title}>{m.title}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">全 {m.items.length} 種・剩餘 {m.totalStock} 顆</p>
                </div>
              </Button>
            ))}
            </div>
          </div>
        )}

        {tab === "sets" && <div className="space-y-4">
          <div className="border-b border-border pb-4"><p className="text-xs text-secondary-foreground">コンプリートセット</p><h1 className="mt-1 text-2xl font-bold">整套收藏賣場</h1><p className="mt-2 text-sm text-muted-foreground">每款各一顆。喜歡的系列，一次帶回家。</p></div>
          <TrustStrip />
          <div className="grid grid-cols-2 gap-3">{machines.filter((m) => m.setPrice > 0).map((m) => <Button variant="bare" size="bare" key={m.id} onClick={() => setSetMachine(m)} className="h-auto flex-col items-stretch overflow-hidden rounded-lg border border-border bg-card p-0 text-left">
            <img src={m.coverImage} alt={m.title} className="aspect-square w-full object-cover" />
            <div className="p-3"><span className="text-[10px] text-secondary-foreground">全 {m.items.length} 種セット</span><h2 className="mt-1 whitespace-normal text-sm font-bold">{m.title}</h2><p className="mt-2 font-bold text-primary">NT${m.setPrice}</p><p className="mt-1 text-[10px] text-muted-foreground">{m.items.every((i) => i.stock > 0) ? "每款一顆・查看全套" : "部分款式已售完"}</p></div>
          </Button>)}</div>
          {!machines.some((m) => m.setPrice > 0) && <Empty text="整套商品準備中，敬請期待" />}
        </div>}

        {tab === "home" && selected && (
          <div className="space-y-4">
            <Button variant="bare" size="bare" onClick={() => setSelectedId(null)} className="flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" /> 返回列表</Button>
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              <img src={selected.coverImage} alt={selected.title} className="aspect-[16/9] w-full object-cover" />
              <div className="p-4">
                <h1 className="text-lg font-bold">{selected.title}</h1>
                <p className="text-sm text-muted-foreground">每抽 NT${selected.price}・剩餘 {selected.totalStock} 顆</p>
                {selected.totalStock > 0 && selected.totalStock <= 3 && <p className="mt-2 flex items-center gap-1 text-xs font-bold text-destructive"><AlertTriangle className="h-4 w-4" />あとわずか・僅剩 {selected.totalStock} 顆</p>}
              </div>
            </div>
            <div className="flex flex-col items-center gap-4 rounded-2xl bg-secondary p-6">
              <div className={`flex h-24 w-24 items-center justify-center rounded-full border-4 border-card bg-[linear-gradient(180deg,var(--primary)_50%,var(--card)_50%)] shadow-lg ${spinning ? "animate-capsule" : ""}`}>
                <RotateCw className="h-8 w-8 text-secondary-foreground" />
              </div>
              {selected.totalStock <= 0 ? (
                <p className="w-full rounded-full bg-muted py-3 text-center font-bold text-muted-foreground">完売御礼・已完售</p>
              ) : (
              <div className="grid w-full grid-cols-2 gap-3">
                {[1, 5].map((n) => (
                  <Button variant="bare" size="bare" key={n} disabled={spinning || selected.totalStock < n} onClick={() => draw(n)} className="rounded-full bg-primary py-3 font-bold text-primary-foreground shadow-md transition active:scale-95 disabled:opacity-50">
                    {n === 1 ? "單抽" : "五連抽"}<span className="block text-xs font-medium">{selected.totalStock < n ? "剩餘不足" : `NT$${selected.price * n}`}</span>
                  </Button>
                ))}
              </div>
              )}
            </div>
            {selected.setPrice > 0 && <Button variant="secondary" className="h-12 w-full rounded-full" onClick={() => setSetMachine(selected)}><ShoppingBag />全套直購・NT${selected.setPrice}</Button>}
            {selected.lastOneName && <section className="flex items-center gap-3 border-y border-border py-4" aria-label="機台最後賞"><Gift className="h-6 w-6 shrink-0 text-primary" />{selected.lastOneImage && <img src={selected.lastOneImage} alt={selected.lastOneName} className="h-16 w-16 rounded-lg object-contain" />}<div className="min-w-0"><p className="text-xs font-bold text-primary">ラストワン賞・最後賞</p><p className="break-words text-sm font-bold">{selected.lastOneName}</p><p className="mt-1 text-xs text-muted-foreground">{selected.lastOneAwarded ? '本機台最後賞已發放' : '抽走最後一顆（含整套直購），額外獲得此贈品。每機台限一次，須於 24 小時內整倉出貨。'}</p></div></section>}
            <div>
              <p className="mb-2 font-bold">全款式一覽</p>
              <div className="grid grid-cols-3 gap-2">
                {selected.items.map((it, index) => (
                  <Button variant="bare" size="bare" onClick={() => setGalleryIndex(index)} aria-label={`查看 ${it.name} 大圖`} key={it.id} className={`relative flex flex-col items-stretch overflow-hidden rounded-lg border border-border bg-card text-left ${it.stock <= 0 ? "opacity-50" : ""}`}>
                    <img src={it.image} alt={it.name} className="aspect-square w-full object-cover" />
                    <span className="absolute right-1 top-1 rounded-full bg-card/90 p-1 text-muted-foreground"><ZoomIn className="h-3.5 w-3.5" /></span>
                    {it.stock <= 0 && <span className="absolute inset-x-0 top-1/3 bg-foreground/70 py-1 text-center text-xs font-bold text-background">已完售</span>}
                    <p className="whitespace-normal px-1.5 pt-1.5 text-xs">{it.name}</p>
                    <p className={`px-1.5 pb-1.5 text-[10px] font-bold ${it.stock > 0 && it.stock <= 2 ? "text-destructive" : "text-muted-foreground"}`}>剩餘 {it.stock} 顆</p>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "vault" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">我的倉庫（{vault.length}）</h2>
            <Button variant="secondary" className="w-full" onClick={()=>go('coupons')}><Gift/>我的折價券・每日御神籤</Button>
            <div className="rounded-lg border border-border bg-card p-3">
              <ShippingProgress subtotal={sum.subtotal} />
              {oldest && <p className="mt-1 text-xs font-bold text-destructive">⏰ 暫存剩餘 {timeLeft(oldest)}（以最早抽到的商品計算）</p>}
            </div>
            <Rules />
            {vault.length === 0 ? <Empty text="倉庫空空的，快去轉蛋吧！" /> : (
              <>
                <div className="grid grid-cols-3 gap-2">
                  {vault.map((v) => (
                    <div key={v.vaultId} className="overflow-hidden rounded-lg border-2 border-border bg-card">
                      <img src={v.image} alt={v.name} className="aspect-square w-full object-cover" />
                      <div className="p-1.5"><p className="text-xs font-bold leading-tight">{v.name}</p><p className="text-[10px] text-muted-foreground">{v.isLastOne ? '🎊 最後賞贈品' : `NT$${v.price}`}</p></div>
                    </div>
                  ))}
                </div>
                <form onSubmit={checkout} className="space-y-3 rounded-lg border border-border bg-card p-4">
                  <p className="flex items-center gap-2 font-bold"><Truck className="h-5 w-5 text-primary" /> 7-11 賣貨便・整單出貨（共 {vault.length} 顆）</p>
                  {([["name", "收件人姓名（請填證件姓名）", "text"], ["phone", "手機號碼（09 開頭 10 碼）", "tel"], ["email", "Email", "email"]] as const).map(([k, l, t]) => (
                    <input key={k} required type={t} placeholder={l} value={ship[k]} onChange={(e) => setShip({ ...ship, [k]: e.target.value })}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
                  ))}
                  <Button variant="bare" size="bare" type="button" onClick={() => setPicker(true)} className="flex w-full items-center gap-2 rounded-lg border-2 border-dashed border-primary bg-background px-3 py-2.5 text-left text-sm">
                    <MapPin className="h-5 w-5 shrink-0 text-primary" />
                    {ship.storeCode ? <span><b>{ship.storeName}門市</b>（店號 {ship.storeCode}）<span className="block text-xs text-primary">點此更換門市</span></span> : <span className="font-bold text-primary">點此選擇 7-11 取貨門市</span>}
                  </Button>
                  {member.userId ? <label className="block text-xs">使用折價券<select className="mt-1 w-full rounded-lg border border-input bg-background p-2 text-sm" value={couponChoice} onChange={e=>setCouponChoice(e.target.value)}><option value="auto">自動選擇最優惠的一張</option><option value="none">不使用折價券</option>{coupons.filter(c=>usableCoupon(c,sum.subtotal)).map(c=><option key={c.id} value={c.id}>{c.name}・滿 {c.minimum} 折 {c.amount}</option>)}</select>{wallet.isError&&<span className="text-destructive">票夾讀取失敗，請重新整理後再使用券。</span>}</label>:<Button type="button" variant="outline" className="w-full" onClick={()=>navigate({to:'/auth'})}>會員登入・使用折價券</Button>}
                  <div className="space-y-1 rounded-xl bg-muted p-3 text-sm">
                    <div className="flex justify-between"><span>扭蛋金額（{vault.length} 顆）</span><span>NT${sum.subtotal}</span></div>
                    {discount>0&&<div className="flex justify-between gap-3 text-secondary-foreground"><span className="break-words">優惠折抵（{chosenCoupon?.name}）</span><span className="shrink-0">−NT${discount}</span></div>}
                    <div className="flex justify-between"><span>7-11 運費</span><span>{sum.fee ? `NT$${sum.fee}` : "免運"}</span></div>
                    <div className="flex justify-between border-t border-border pt-1 font-bold"><span>取貨付款總金額</span><span className="text-primary">NT${checkoutTotal}</span></div>
                  </div>
                  <p className="text-[11px] text-muted-foreground">單筆限一張券，運費不折抵；免運按折扣前商品金額計算。</p>
                  <p className="text-xs leading-relaxed text-secondary-foreground">不需先匯款。出貨申請由店長人工整理至 7-11 賣貨便，到店取貨付款；本站非 7-11 官方網站。</p>
                  <p className="text-xs text-muted-foreground">📦 包裹到店後請於 7 日內取貨付款，未取件將影響日後購買資格。</p>
                  <label className="flex items-start gap-2 text-xs"><input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--primary)]" /> 我已閱讀並同意：{RULES}</label>
                  <Button variant="bare" size="bare" disabled={sending} className="w-full rounded-full bg-primary py-3 font-bold text-primary-foreground disabled:opacity-50">{sending ? "送出中…" : `📦 一鍵整單出貨（共 ${vault.length} 顆・NT$${checkoutTotal}）`}</Button>
                </form>
              </>
            )}
          </div>
        )}

        {tab === "orders" && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold">我的訂單</h2>
            <div className="flex gap-1 overflow-x-auto">{["全部", ...ORDER_STATUSES].map((status) => <Button variant={customerStatus === status ? "secondary" : "ghost"} size="sm" key={status} onClick={() => setCustomerStatus(status)} className="rounded-full">{status}</Button>)}</div>
            {orders.length === 0 ? <Empty text="尚無出貨訂單" /> : orders.filter((o) => customerStatus === "全部" || o.status === customerStatus).map((o) => <OrderCard key={o.id} o={o} />)}
          </div>
        )}

        {tab === "coupons" && <RewardWallet />}
        {tab === "admin" && <AdminGate><Admin machines={machines} reload={reloadMachines} flash={flash} /></AdminGate>}
      </main>

      <footer className="mx-auto mb-4 max-w-2xl border-t border-border px-4 pt-5 text-center text-xs leading-relaxed text-muted-foreground"><p className="font-bold text-foreground">奶油貓・日本線上扭蛋屋</p><p className="mt-1">日本正版扭蛋・7-11 賣貨便到店付款</p><p>不要求 ATM 操作或提前匯款；遇到疑問請先聯繫店長。</p>{info.lineUrl && <a className="mt-2 inline-flex items-center gap-1 text-secondary-foreground" href={info.lineUrl} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4" />LINE 客服</a>}{info.serviceHours && <p>{info.serviceHours}</p>}</footer>
      <nav aria-label="底部導覽" className="boutique-dock fixed inset-x-3 bottom-3 z-30 mx-auto max-w-md rounded-2xl border border-border">
        <div className="grid grid-cols-4">
          {([["home", "扭蛋機台"], ["sets", "整套專區"], ["vault", "我的倉庫"], ["orders", "訂單進度"]] as const).map(([k, l]) => (
            <Button variant="bare" size="bare" key={k} onClick={() => go(k)} aria-current={tab === k ? "page" : undefined}
              className={`dock-item relative h-16 flex-col gap-1 rounded-xl text-[11px] ${tab === k ? "text-primary dock-active" : "text-muted-foreground"}`}>
              <DockIcon kind={k} />{l}
              {k === "vault" && vault.length > 0 && <span className="absolute right-[27%] top-1 rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">{vault.length}</span>}
            </Button>
          ))}
        </div>
      </nav>

      {menu && <SideMenu info={info} onClose={() => setMenu(false)} go={(t) => { go(t); setMenu(false); }} />}

      {setMachine && <SetPopup machine={setMachine} busy={buying} onBuy={purchaseSet} onClose={() => setSetMachine(null)} />}
      {galleryIndex !== null && selected && <PrizeGallery machine={selected} index={galleryIndex} onIndex={setGalleryIndex} onClose={() => setGalleryIndex(null)} onDraw={() => { setGalleryIndex(null); draw(1); }} />}
      {phase && <GachaScene phase={phase} count={animationCount} sound={sound} onSound={toggleSound} skipped={skipped} onSkip={() => skipRef.current?.()} />}

      {albumOpen && deviceId && <CatAlbum deviceId={deviceId} onClose={() => setAlbumOpen(false)} flash={flash} onLogin={() => { setAlbumOpen(false); go("coupons"); }} />}
      {result && <DrawResultDialog cards={newCards} onAlbum={() => { setResult(null); setAlbumOpen(true); }} items={result} canRepeat={!spinning && !!selected && selected.totalStock >= repeatDrawCount(result)} onClose={() => { setResult(null); audioRef.current?.stop(); }} onRepeat={() => { const n = repeatDrawCount(result); audioRef.current?.stop(); setResult(null); draw(n); }} onVault={() => { audioRef.current?.stop(); setResult(null); go('vault'); }} onShare={() => setShareItems(result)} />}
      {shareItems && <ShareCard items={shareItems} onClose={() => setShareItems(null)} flash={flash} />}

      {picker && <StorePicker onClose={() => setPicker(false)} onPick={(st) => { setShip((p) => ({ ...p, storeName: st.name, storeCode: st.code })); setPicker(false); }} />}

      {toast && <div className="animate-toast fixed inset-x-4 bottom-24 z-40 mx-auto max-w-sm rounded-xl bg-foreground px-4 py-3 text-center text-sm text-background shadow-lg">{toast}</div>}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">{text}</div>;
}

function OrderCard({ o, children }: { o: Order; children?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 text-sm">
      <div className="flex justify-between"><span className="font-bold">{o.id}</span><span className={`st-${o.status} rounded-full px-2.5 py-0.5 text-xs font-bold`}>{o.status}</span></div>
      <p className="text-xs text-muted-foreground">{o.createdAt}・總金額 NT${o.total}</p>
      {!!o.discount&&<p className="mt-1 text-xs text-secondary-foreground">{o.couponName}・已折抵 NT${o.discount}</p>}
      <ul className="mt-2 divide-y divide-border rounded-xl bg-muted/60 px-3">
        {groupItems(o.items).map((g) => <li key={g.name} className="flex justify-between gap-2 py-1.5"><span>{g.name}</span><span className="shrink-0 font-bold">- {g.qty} 顆</span></li>)}
      </ul>
      <p className="mt-1 text-xs text-muted-foreground">7-11 {o.shipping.storeName}（{o.shipping.storeCode}）・{o.shipping.name} {o.shipping.phone}</p>
      {children}
    </div>
  );
}

function Admin({ machines, reload, flash }: { machines: Machine[]; reload: () => Promise<void>; flash: (m: string) => void }) {
  const [view, setView] = useState<"machines" | "orders" | "seller" | "shop" | "rewards">("machines");
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
  const field = "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm";

  const save = async () => {
    if (!edit) return;
    if (!edit.title.trim()) return flash("請輸入名稱");
    try { await saveM({ data: edit }); } catch { return flash("儲存失敗"); }
    setEdit(null); reload(); flash("已儲存");
  };

  const exportCsv = async () => {
    const list = orders.filter((o) => o.status === "待出貨");
    if (!list.length) return flash("沒有待出貨訂單");
    const XLSX = await import("xlsx");
    if (list.length > 500) return flash("一次最多匯出 500 筆，請先處理部分訂單");
    const ws = XLSX.utils.aoa_to_sheet(buildMyshipRows(list));
    ws["!cols"] = Array.from({ length: 10 }, () => ({ wch: 22 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "訂單匯入");
    XLSX.writeFile(wb, `賣貨便_訂單匯入_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  if (edit) return (
    <div className="space-y-3">
      <Button variant="bare" size="bare" onClick={() => setEdit(null)} className="flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" /> 返回</Button>
      <h2 className="text-lg font-bold">編輯扭蛋機</h2>
      <input className={field} placeholder="名稱" value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} />
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs">單價<input type="number" className={field} value={edit.price} onChange={(e) => setEdit({ ...edit, price: +e.target.value })} /></label>
        <div className="text-xs">總庫存（自動加總）<p className="rounded-xl bg-muted px-3 py-2 text-sm font-bold">{edit.items.reduce((a, i) => a + (Number(i.stock) || 0), 0)} 顆</p></div>
      </div>
      <label className="block text-xs">整套售價（0 表示不販售整套）<input className={field} type="number" min={0} value={edit.setPrice} onChange={(e) => setEdit({ ...edit, setPrice: Math.max(0, +e.target.value) })} /></label>
      <section className="space-y-2 border-y border-border py-3"><p className="flex items-center gap-1 text-sm font-bold"><Gift className="h-4 w-4 text-primary" />最後賞設定</p><label className="block text-xs">最後賞名稱（留白不啟用）<input className={field} value={edit.lastOneName ?? ''} onChange={(e) => setEdit({ ...edit, lastOneName: e.target.value })} /></label><div className="flex items-center gap-3">{edit.lastOneImage && <img src={edit.lastOneImage} alt="最後賞" className="h-16 w-16 rounded-lg object-contain" />}<ImageUpload label="上傳最後賞照片" flash={flash} onDone={(url) => setEdit((e) => e && { ...e, lastOneImage: url })} /></div><p className="text-xs text-muted-foreground">{edit.lastOneAwarded ? '此機台已發放最後賞；補庫存或儲存不會重複發放。新活動請建立新機台。' : '消耗最後庫存時贈送一份（含整套直購）。最後賞不計價、不計入可抽庫存，逾期失去資格，不再次發放。'}</p></section>
      <input className={field} placeholder="狀態標籤" value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })} />
      <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-2">
        {edit.coverImage ? <img src={edit.coverImage} alt="" className="h-16 w-16 rounded-lg object-cover" /> : <div className="h-16 w-16 rounded-lg bg-muted" />}
        <ImageUpload label="上傳機台封面" flash={flash} onDone={(url) => setEdit((e) => e && { ...e, coverImage: url })} />
      </div>
      <p className="pt-2 font-bold">商品款式（{edit.items.length}）・每款各自設定顆數</p>
      {edit.items.map((it, idx) => {
        const up = (p: Partial<typeof it>) => setEdit({ ...edit, items: edit.items.map((x, j) => (j === idx ? { ...x, ...p } : x)) });
        return (
        <div key={it.id} className="flex gap-2 rounded-lg border border-border bg-card p-2">
          <img src={it.image} alt="" className="h-14 w-14 rounded-lg bg-muted object-cover" />
          <div className="flex-1 space-y-1">
            <input className={field} placeholder="商品名稱" value={it.name} onChange={(e) => up({ name: e.target.value })} />
            <ImageUpload label="上傳款式照片" flash={flash} onDone={(url) => setEdit((e) => e && { ...e, items: e.items.map((x) => (x.id === it.id ? { ...x, image: url } : x)) })} />
            <label className="flex items-center gap-2 text-xs">此款庫存<input type="number" min={0} className={field} value={it.stock} onChange={(e) => up({ stock: Math.max(0, +e.target.value) })} />顆</label>
          </div>
          <Button variant="bare" size="bare" onClick={() => setEdit({ ...edit, items: edit.items.filter((_, j) => j !== idx) })} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
        </div>
      ); })}
      <Button variant="bare" size="bare" onClick={() => setEdit({ ...edit, items: [...edit.items, { id: "i" + Date.now() + Math.random().toString(36).slice(2, 6), name: "", image: "", stock: 5 }] })} className="flex w-full items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border py-2 text-sm"><Plus className="h-4 w-4" /> 新增商品</Button>
      <Button variant="bare" size="bare" onClick={save} className="flex w-full items-center justify-center gap-1 rounded-full bg-primary py-3 font-bold text-primary-foreground"><Check className="h-4 w-4" /> 儲存</Button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 rounded-full bg-muted p-1 text-xs font-bold">
        {(["machines", "orders", "seller", "shop", "rewards"] as const).map((v) => (
          <Button variant="bare" size="bare" key={v} onClick={() => setView(v)} className={`rounded-full py-2 ${view === v ? "bg-card text-primary shadow" : "text-muted-foreground"}`}>
            {v === "machines" ? "扭蛋機" : v === "orders" ? `訂單` : v === "seller" ? "賣家設定" : v==='rewards'?'會員優惠':"商店公告"}
          </Button>
        ))}
      </div>
      {view === 'rewards' ? <RewardSettingsForm flash={flash}/> : view === "shop" ? <ShopInfoForm flash={flash} /> : view === "seller" ? <SellerForm flash={flash} /> : view === "machines" ? (
        <>
          <Button variant="bare" size="bare" onClick={() => setEdit({ id: "m" + Date.now(), title: "", price: 100, totalStock: 0, setPrice: 0, coverImage: "", status: "熱烈販售中", items: [] })}
            className="flex w-full items-center justify-center gap-1 rounded-full bg-primary py-2.5 font-bold text-primary-foreground"><Plus className="h-4 w-4" /> 新增扭蛋機</Button>
          <MachineOrderList machines={machines} reload={reload} flash={flash} onEdit={setEdit} onDelete={async (id) => { if (confirm('確定刪除？')) { await delM({ data: { id } }); await reload(); } }} />
        </>
      ) : (
        <>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <Button variant="bare" size="bare" onClick={exportCsv} className="flex items-center justify-center gap-1 rounded-full bg-primary py-2.5 font-bold text-primary-foreground"><Download className="h-4 w-4" /> 匯出 7-11 賣貨便 Excel</Button>
            <Button variant="bare" size="bare" onClick={loadOrders} aria-label="重新整理" className="rounded-full bg-muted px-3 text-muted-foreground"><RefreshCw className="h-4 w-4" /></Button>
          </div>
          <p className="text-center text-xs text-muted-foreground">賣貨便十欄格式・匯出待出貨訂單（不含官方驗證巨集）。若平台要求 .xlsm，請將資料貼入官方範本驗證；匯出不代表已建立物流單。</p>
          <div className="grid grid-cols-5 gap-1 text-xs font-bold">
            {[...ORDER_STATUSES, "全部"].map((s) => {
              const n = s === "全部" ? orders.length : orders.filter((o) => o.status === s).length;
              return <Button variant="bare" size="bare" key={s} onClick={() => setOstat(s)} className={`rounded-full py-1.5 ${ostat === s ? (s === "全部" ? "bg-foreground text-background" : `st-${s}`) : "bg-muted text-muted-foreground"} ${ostat === s ? "ring-2 ring-ring/40" : ""}`}>{s}({n})</Button>;
            })}
          </div>
          {(() => { const list = ostat === "全部" ? orders : orders.filter((o) => o.status === ostat); return list.length === 0 ? <Empty text={`沒有「${ostat}」訂單`} /> : list.map((o) => (
            <OrderCard key={o.id} o={o}>
              <div className="mt-3 flex flex-wrap gap-1">
                {ORDER_STATUSES.map((s) => (
                  <Button variant="bare" size="bare" key={s} onClick={async () => { setOrders((p) => p.map((x) => (x.id === o.id ? { ...x, status: s } : x))); await setStatus({ data: { id: o.id, status: s } }).catch(() => flash("更新失敗")); }}
                    className={`rounded-full px-3 py-1 text-xs font-bold ${o.status === s ? `st-${s}` : "bg-muted text-muted-foreground"}`}>{s}</Button>
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
        <Button variant="bare" size="bare" onClick={async () => { await lock(); setState("locked"); }} className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">登出後台</Button>
      </div>
      {children}
    </div>
  );
  return (
    <form onSubmit={async (e) => { e.preventDefault(); setBusy(true); setErr(false);
        const r = await unlock({ data: { password: pw } }).catch(() => ({ ok: false }));
        setBusy(false); if (r.ok) { setPw(""); setState("open"); } else setErr(true); }}
      className="mx-auto mt-8 max-w-xs space-y-3 rounded-lg border border-border bg-card p-5 text-center">
      <Settings className="mx-auto h-8 w-8 text-primary" />
      <p className="font-bold">管理者後台</p>
      <input type="password" autoComplete="current-password" placeholder="請輸入後台密碼" value={pw} onChange={(e) => setPw(e.target.value)}
        className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm" />
      {err && <p className="text-xs text-destructive">密碼錯誤</p>}
      <Button variant="bare" size="bare" disabled={busy || !pw} className="w-full rounded-full bg-primary py-2.5 font-bold text-primary-foreground disabled:opacity-50">進入後台</Button>
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
  const field = "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm";
  return (
    <form className="space-y-2 rounded-lg border border-border bg-card p-4" onSubmit={async (e) => {
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
      <Button variant="bare" size="bare" disabled={busy} className="w-full rounded-full bg-primary py-2.5 font-bold text-primary-foreground disabled:opacity-50">{busy ? "儲存中…" : "儲存"}</Button>
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
  const field = "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm";
  return (
    <div className="bg-overlay fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="flex max-h-[85vh] w-full max-w-md flex-col rounded-t-3xl bg-card p-4 sm:rounded-2xl">
        <div className="mb-3 flex items-center justify-between">
          <p className="flex items-center gap-1 font-bold"><MapPin className="h-5 w-5 text-primary" /> 選擇 7-11 取貨門市</p>
          <Button variant="bare" size="bare" onClick={onClose} aria-label="關閉"><X className="h-5 w-5" /></Button>
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
          <Button variant="bare" size="bare" aria-label="搜尋" className="rounded-xl bg-primary px-3 text-primary-foreground"><Search className="h-4 w-4" /></Button>
        </form>
        <div className="mt-3 flex-1 space-y-2 overflow-y-auto">
          {busy && <p className="py-6 text-center text-sm text-muted-foreground">搜尋中…</p>}
          {!busy && list?.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">找不到門市，請換個關鍵字</p>}
          {!busy && !list && <p className="py-6 text-center text-xs text-muted-foreground">選擇縣市與區域，或直接輸入門市名稱／店號</p>}
          {!busy && list?.map((s) => (
            <Button variant="bare" size="bare" key={s.code} onClick={() => onPick(s)} className="w-full rounded-lg border border-border p-3 text-left active:bg-muted">
              <p className="text-sm font-bold">{s.name}門市 <span className="text-xs font-medium text-muted-foreground">店號 {s.code}</span></p>
              <p className="text-xs text-muted-foreground">{s.address}</p>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Rules() {
  return (
    <div className="flex gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs font-bold leading-relaxed">
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
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("圖片無法處理");
  ctx.drawImage(img, 0, 0, c.width, c.height);
  img.close();
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
  const field = "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm";
  const F: [Exclude<keyof ShopInfo, "banners">, string][] = [["lineUrl", "LINE 客服連結（可使用個人帳號）"], ["igUrl", "Instagram 連結（https://instagram.com/...）"], ["serviceHours", "客服時間（例：每日 10:00–22:00）"], ["contactEmail", "客服 Email"]];
  return (
    <form className="space-y-2 rounded-lg border border-border bg-card p-4" onSubmit={async (e) => {
      e.preventDefault();
      try { await save({ data: s }); flash("已更新，所有顧客立即看到"); } catch (err) { flash(err instanceof Error && err.message.includes("https") ? "連結需以 https:// 開頭" : "儲存失敗"); }
    }}>
      <p className="font-bold">商店與公告設定</p>
      <div className="space-y-2 border-b border-border pb-3"><p className="text-xs font-bold">首頁輪播（最多 8 張）</p>
        {(s.banners || []).map((url, i) => <div key={url} className="flex items-center gap-2"><img src={url} alt={`輪播 ${i + 1}`} className="h-16 w-28 rounded-lg object-cover" /><Button type="button" variant="ghost" size="icon" aria-label={`上移輪播 ${i + 1}`} disabled={i === 0} onClick={() => setS((p) => { const banners = [...p.banners]; const previous = banners[i - 1]; const current = banners[i]; if (previous === undefined || current === undefined) return p; banners[i - 1] = current; banners[i] = previous; return { ...p, banners }; })}><ArrowLeft className="rotate-90" /></Button><Button type="button" variant="ghost" size="icon" aria-label={`刪除輪播 ${i + 1}`} onClick={() => setS((p) => ({ ...p, banners: p.banners.filter((_, n) => n !== i) }))}><Trash2 /></Button><ImageUpload label="替換" flash={flash} onDone={(url) => setS((p) => ({ ...p, banners: p.banners.map((v, n) => n === i ? url : v) }))} /></div>)}
        {(s.banners || []).length < 8 && <ImageUpload label="新增輪播照片" flash={flash} onDone={(url) => setS((p) => ({ ...p, banners: [...(p.banners || []), url].slice(0, 8) }))} />}
        <p className="text-[10px] text-muted-foreground">建議橫式 2:1 圖片；全部移除時顯示預設宣導。修改後請按儲存。</p>
      </div>
      <label className="block text-xs">跑馬燈公告<textarea rows={3} className={field} value={s.marquee} onChange={(e) => setS({ ...s, marquee: e.target.value })} /></label>
      {F.map(([k, l]) => <label key={k} className="block text-xs">{l}<input className={field} value={s[k]} onChange={(e) => setS({ ...s, [k]: e.target.value })} /></label>)}
      <Button variant="bare" size="bare" className="w-full rounded-full bg-primary py-2.5 font-bold text-primary-foreground">儲存</Button>
    </form>
  );
}

function SideMenu({ info, onClose, go }: { info: ShopInfo; onClose: () => void; go: (t: "home" | "vault" | "orders" | "admin" | "sets" | "coupons") => void }) {
  const member=useMember();const navigate=useNavigate();
  const [open, setOpen] = useState<string | null>("guide");
  const Sec = ({ id, icon: Icon, title, children }: { id: string; icon: typeof BookOpen; title: string; children: React.ReactNode }) => (
    <div className="rounded-2xl border border-border bg-card">
      <Button variant="bare" size="bare" onClick={() => setOpen(open === id ? null : id)} className="flex w-full items-center gap-2 p-3 text-left text-sm font-bold"><Icon className="h-4 w-4 text-primary" />{title}</Button>
      {open === id && <div className="space-y-1.5 px-3 pb-3 text-xs leading-relaxed text-muted-foreground">{children}</div>}
    </div>
  );
  return (
    <div className="bg-overlay fixed inset-0 z-40" onClick={onClose}>
      <aside onClick={(e) => e.stopPropagation()} className="animate-drawer absolute inset-y-0 right-0 flex w-[85%] max-w-sm flex-col gap-3 overflow-y-auto bg-background p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <img src={catLogo} alt="" width={48} height={48} className="h-12 w-12 rounded-full bg-card p-0.5" />
            <div><p className="font-bold">奶油貓 扭蛋屋</p><p className="text-[10px]">クリームキャット ガチャ屋</p><p className="text-xs text-muted-foreground">在台灣也能享受日本扭蛋的驚喜</p></div>
          </div>
          <Button variant="bare" size="bare" onClick={onClose} aria-label="關閉"><X className="h-5 w-5" /></Button>
        </div>
        <div className="border-y border-border py-3 text-xs leading-relaxed text-muted-foreground"><p className="font-bold text-foreground">日本街角的驚喜，送到台灣的你手中。</p><p className="mt-2">店長住在日本，為你挑選當地正版扭蛋。這裡是奶油貓的線上店舖，不是 7-11 官方網站；訂單由店長整理後透過賣貨便寄送。</p></div>
        <Button variant="secondary" className="rounded-full" onClick={() => go("sets")}><ShoppingBag />整套收藏賣場</Button>
        <Button variant="secondary" onClick={()=>go('coupons')}><Gift/>我的折價券・每日御神籤</Button>
        <Button variant="outline" onClick={()=>navigate({to:'/auth'})}>{member.userId?'會員帳戶・登出':'會員登入'}</Button>
        <Sec id="guide" icon={BookOpen} title="新手玩法 3 步驟">
          <p>① 挑選喜歡的扭蛋機，單抽或五連抽。</p>
          <p>② 抽到的扭蛋自動放進「我的倉庫」，免費暫存 {VAULT_HOURS} 小時。</p>
          <p>③ 申請出貨、選擇 7-11 門市，貨到付款寄到你身邊。</p>
        </Sec>
        <Sec id="ship" icon={Truck} title="運費與寄送說明">
          <p>單筆商品金額滿 NT${FREE_SHIP_AMOUNT.toLocaleString()} 免運；未滿運費 NT${SHIP_FEE}。抽蛋與整套直購合併計算。</p>
          <p>{RULES}</p>
        </Sec>
        <Sec id="safe" icon={ShieldCheck} title="安心購物保證">
          <p>✅ 7-11 取貨付款：到門市取件時才付款，不需事先轉帳。</p>
          <p>✅ 每款獎品獨立庫存，抽中時即扣除並保留 24 小時。</p>
          <p>⚠️ 本店不會主動要求您轉帳、提供信用卡或 ATM 操作，如遇可疑訊息請透過官方 LINE 確認。</p>
          <p>隨機商品可能重複，請確認款式再抽；瑕疵、錯寄與依法享有的權利不因隨機商品而排除，請聯繫店長處理。</p>
        </Sec>
        <Sec id="faq" icon={MessageCircle} title="常見問題與商品包裝"><p className="font-bold text-foreground">不想抽到重複怎麼辦？</p><p>可選擇整套直購，每款各一顆。隨機抽獎仍可能連續抽中相同款式。</p><p className="font-bold text-foreground">會附蛋紙嗎？</p><p>附日本原廠蛋紙。若收到商品有瑕疵或款式不符，請保留包裝並聯繫店長。</p><p className="font-bold text-foreground">換手機後還找得到倉庫嗎？</p><p>目前倉庫記錄在此瀏覽器，請勿清除資料或更換瀏覽器；出貨前確認全部商品。</p><p className="font-bold text-foreground">可以在超商拆箱再付款嗎？</p><p>超商通常須先付款取件，並非付款前開箱驗貨。異常商品請向本店反映。</p></Sec>
        <div className="grid grid-cols-2 gap-2">
          {info.lineUrl && <a href={info.lineUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1 rounded-full bg-secondary py-2.5 text-sm font-bold text-secondary-foreground"><MessageCircle className="h-4 w-4" />LINE 客服</a>}
          {info.igUrl && <a href={info.igUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1 rounded-full bg-accent py-2.5 text-sm font-bold text-accent-foreground"><Instagram className="h-4 w-4" />Instagram</a>}
        </div>
        {(info.serviceHours || info.contactEmail) && <p className="text-center text-xs text-muted-foreground">{info.serviceHours}{info.serviceHours && info.contactEmail ? "・" : ""}{info.contactEmail}</p>}
        <div className="mt-auto border-t border-border pt-3 text-center">
          <Button variant="bare" size="bare" onClick={() => go("admin")} className="inline-flex items-center gap-1 text-[11px] text-muted-foreground"><Lock className="h-3 w-3" />店家管理登入</Button>
        </div>
      </aside>
    </div>
  );
}
