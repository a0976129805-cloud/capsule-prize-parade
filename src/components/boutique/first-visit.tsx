import { Mail, Package, BookOpen, ExternalLink, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { FREE_SHIP_AMOUNT, SHIP_FEE, VAULT_HOURS } from '@/lib/shipping';
import catLogo from '@/assets/cat-logo.png';

export function MemberDrawPrompt({ open, onClose, onLogin }: { open: boolean; onClose: () => void; onLogin: () => void }) {
  return <Dialog open={open} onOpenChange={(value) => { if (!value) onClose(); }}><DialogContent className="w-[calc(100%-2rem)] max-w-sm rounded-lg bg-card">
    <img src={catLogo} alt="" className="mx-auto h-16 w-16 object-contain" />
    <DialogTitle className="text-center text-lg font-bold">讓奶油貓幫你留住小幸福</DialogTitle>
    <DialogDescription className="text-center leading-relaxed">抽蛋前先綁定會員，不用設定密碼。首次收信驗證，再填姓名與電話，就能安心收藏。</DialogDescription>
    <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground"><Package className="h-4 w-4 shrink-0 text-secondary-foreground" />扭蛋保留 {VAULT_HOURS} 小時，貓咪卡結帳後正式入冊。同一瀏覽器未登出會保留登入。</p>
    <Button className="h-11 w-full" onClick={onLogin}><Mail />收信驗證・開始收藏</Button><Button variant="ghost" onClick={onClose}>先繼續逛逛</Button>
  </DialogContent></Dialog>;
}

export function OfficialStoreLookup() {
  return <div className="border-b border-border pb-3"><Button asChild variant="outline" className="h-10 w-full text-xs"><a href="https://emap.pcsc.com.tw/" target="_blank" rel="noopener noreferrer"><MapPin />7-11 官方門市查詢<ExternalLink /></a></Button><p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">查好後回到此頁，輸入門市名稱或 6 碼店號搜尋並選取。門市是否可收件以賣貨便確認為準。</p></div>;
}

export function StorefrontFaq({ lineUrl = '', contactEmail = '' }: { lineUrl?: string; contactEmail?: string }) {
  const questions = [
    { key: 'genuine', title: '是日本正版嗎？會附蛋紙嗎？', answer: '本店販售日本正版扭蛋，附日本原廠蛋紙。收到瑕疵或款式不符的商品，請保留包裝並聯繫店長。' },
    { key: 'one', title: '只抽一顆也能寄嗎？', answer: `可以！商品金額未滿 NT$${FREE_SHIP_AMOUNT.toLocaleString()}，運費 NT$${SHIP_FEE}；滿額免運。倉庫內所有商品須一起結帳寄出，請在 ${VAULT_HOURS} 小時內申請出貨。` },
    { key: 'dispatch', title: '下單後幾天出貨？', answer: '訂單由店長人工整理，再透過 7-11 賣貨便寄送。實際出貨時間請向店長確認；送單後可在「訂單進度」查看處理狀態。' },
    { key: 'random', title: '會抽到重複嗎？貓咪卡何時入冊？', answer: '扭蛋與貓咪卡都可能重複。附贈卡片先顯示待結帳，整倉送出訂單後才正式入冊；逾期未結帳的卡片會作廢。' },
  ];
  return <section aria-label="新手常見問答" className="border-t border-border pt-5"><p className="text-[10px] font-bold text-secondary-foreground">はじめてのお客さまへ</p><h2 className="mt-1 flex items-center gap-2 text-base font-bold"><BookOpen className="h-4 w-4 text-primary" />第一次來，想問問</h2><Accordion type="single" collapsible className="mt-2">{questions.map(({ key, title, answer }) => <AccordionItem key={key} value={key} className="border-border"><AccordionTrigger className="gap-3 text-xs font-bold">{title}</AccordionTrigger><AccordionContent className="text-xs leading-relaxed text-muted-foreground">{answer}{key === 'dispatch' && (lineUrl || contactEmail) && <Button asChild variant="link" size="sm" className="mt-2 h-auto p-0"><a href={lineUrl || `mailto:${contactEmail}`} target={lineUrl ? '_blank' : undefined} rel="noopener noreferrer">詢問店長<ExternalLink /></a></Button>}</AccordionContent></AccordionItem>)}</Accordion></section>;
}