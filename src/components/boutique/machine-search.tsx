import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const POPULAR_SEARCHES = ['潦草小狗', '吉伊卡哇', '貓咪', '一番賞'] as const;

export function MachineSearch({
  id,
  value,
  onChange,
  onSubmit,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit?.(value);
        }}
      >
        <label className="relative block min-w-0 flex-1">
          <span className="sr-only">搜尋機台或款式</span>
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id={id}
            type="search"
            value={value}
            maxLength={80}
            onChange={(event) => onChange(event.target.value)}
            placeholder="搜尋機台或款式，例如：小狗、貓咪"
            className="h-11 w-full rounded-full border border-input bg-card py-2.5 pl-9 pr-9 text-sm outline-none focus:ring-2 focus:ring-ring [&::-webkit-search-cancel-button]:hidden"
          />
          {value && (
            <button
              type="button"
              aria-label="清除搜尋關鍵字"
              onClick={() => onChange('')}
              className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </label>
        {onSubmit && <Button type="submit" className="h-11 shrink-0 rounded-full px-4">搜尋</Button>}
      </form>
      <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-0.5" aria-label="熱門關鍵字">
        {POPULAR_SEARCHES.map((keyword) => {
          const selected = value.trim() === keyword;
          return (
            <button
              key={keyword}
              type="button"
              aria-pressed={selected}
              onClick={() => {
                const next = selected ? '' : keyword;
                onChange(next);
                onSubmit?.(next);
              }}
              className={`min-h-8 shrink-0 rounded-full border px-3 py-1 text-xs transition-colors ${selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground'}`}
            >
              #{keyword}
            </button>
          );
        })}
      </div>
    </div>
  );
}
