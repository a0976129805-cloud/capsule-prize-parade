import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { ArrowRight, Gift, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { publicNewcomerReward } from '@/lib/rewards.functions';
import { useMember } from './member-session';
import { useWallet } from './reward-wallet';

/** Shows only an offer the owner has actually enabled; never invents a promotion. */
export function NewcomerInvite({ onOpen }: { onOpen: () => void }) {
  const load = useServerFn(publicNewcomerReward);
  const offer = useQuery({ queryKey: ['public-newcomer-reward'], queryFn: () => load(), staleTime: 60_000, retry: false });
  const member = useMember();
  const wallet = useWallet();
  const reward = offer.data;
  if (!reward?.enabled) return null;
  const claimed = !!member.userId && !!wallet.data?.state?.newcomer_claimed;
  return <section aria-label="新人見面禮" className="overflow-hidden rounded-lg border border-primary/30 bg-card shadow-sm">
    <Button variant="bare" size="bare" onClick={onOpen} className="flex w-full items-center gap-3 whitespace-normal p-3 text-left">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground"><Gift className="h-6 w-6" /></span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-secondary-foreground"><Ticket className="h-3.5 w-3.5" />はじめましてのプレゼント</span>
        <span className="mt-0.5 block text-sm font-bold">{claimed ? '新人禮已領取・打開我的票夾' : reward.name}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">滿 NT${reward.minimum} 折 NT${reward.amount}・{claimed ? '每筆訂單限用一張' : member.userId ? `領取後 ${reward.days} 天有效` : '登入領取・每位會員限一次'}</span>
      </span>
      <ArrowRight className="h-5 w-5 shrink-0 text-primary" />
    </Button>
  </section>;
}
