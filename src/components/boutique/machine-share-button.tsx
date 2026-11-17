import { useState } from 'react';
import { Check, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { copyText, machineShareText, type ShareableMachine } from '@/lib/machine-share';

export function MachineShareButton({ machine, onResult }: { machine: ShareableMachine; onResult: (message: string) => void }) {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const share = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await copyText(machineShareText(machine, window.location.origin));
      setCopied(true);
      onResult('已複製機台宣傳文案與直達連結');
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      onResult('複製失敗，請稍後再試');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button type="button" variant="outline" className="w-full rounded-full" disabled={busy} onClick={share}>
      {copied ? <Check aria-hidden="true" /> : <Share2 aria-hidden="true" />}
      {copied ? '已複製宣傳文案＋連結' : '複製宣傳文案＋直達連結'}
    </Button>
  );
}
