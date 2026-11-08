import type { VaultItem } from '@/lib/gacha.functions';
import { groupVaultItems } from '@/lib/vault-groups';

export function VaultPrizes({ items }: { items: VaultItem[] }) {
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
    {groupVaultItems(items).map(({ key, item, quantity }) => (
      <div key={key} className="relative overflow-hidden rounded-lg border-2 border-border bg-card">
        <img src={item.image} alt={item.name} className="aspect-square w-full object-contain" />
        <span aria-label={`數量 ${quantity} 顆`} className="absolute right-2 top-2 flex h-7 min-w-9 items-center justify-center rounded-full border border-border bg-accent px-2 text-sm font-bold tabular-nums text-accent-foreground">×{quantity}</span>
        <div className="space-y-1 p-2">
          <p className="break-words text-xs font-bold leading-relaxed">{item.name}</p>
          <p className="text-[11px] text-muted-foreground">{item.isLastOne ? '🎊 最後賞贈品' : `NT$${item.price}／顆`}</p>
        </div>
      </div>
    ))}
  </div>;
}