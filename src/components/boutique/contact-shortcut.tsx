import { Instagram, Mail, MessageCircle } from 'lucide-react';
import catLogo from '@/assets/cat-logo.png';
import { storeContact } from '@/lib/contact-link';
import type { ShopInfo } from '@/lib/shop-info';

export function ContactShortcut({ info }: { info: ShopInfo }) {
  const contact = storeContact(info);
  if (!contact) return null;

  const Icon = contact.channel === 'Instagram' ? Instagram : contact.channel === 'LINE' ? MessageCircle : Mail;
  const external = contact.channel !== 'Email';

  return (
    <a
      href={contact.href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      aria-label={`${contact.label}（開啟${contact.channel}）`}
      className="contact-shortcut fixed bottom-24 right-4 z-20 flex min-h-12 items-center gap-2 rounded-full border border-primary/20 bg-card py-1.5 pl-2 pr-3.5 text-xs font-bold text-foreground shadow-lg"
    >
      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary">
        <img src={catLogo} alt="" width={36} height={36} className="h-9 w-9 rounded-full object-contain" />
        <span className="absolute -bottom-0.5 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground">
          <Icon className="h-2.5 w-2.5" aria-hidden="true" />
        </span>
      </span>
      <span>{contact.label}</span>
    </a>
  );
}
