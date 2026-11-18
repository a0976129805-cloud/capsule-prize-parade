export type ShopContact = {
  href: string;
  channel: 'Instagram' | 'LINE' | 'Email';
  label: string;
};

type ContactInfo = { igUrl?: string; lineUrl?: string; contactEmail?: string };

function instagramMessageUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    if (host === 'ig.me') return value;
    if (host !== 'instagram.com' && host !== 'm.instagram.com') return value;
    const [first] = url.pathname.split('/').filter(Boolean);
    if (!first || ['p', 'reel', 'reels', 'stories', 'explore', 'accounts', 'direct'].includes(first)) return value;
    return `https://ig.me/m/${first}`;
  } catch {
    return value;
  }
}

/** Prefer the owner's chosen Instagram channel, then retain existing contact fallbacks. */
export function storeContact(info: ContactInfo): ShopContact | null {
  const igUrl = info.igUrl?.trim();
  if (igUrl) return { href: instagramMessageUrl(igUrl), channel: 'Instagram', label: '私訊店長 IG' };

  const lineUrl = info.lineUrl?.trim();
  if (lineUrl) return { href: lineUrl, channel: 'LINE', label: '私訊店長 LINE' };

  const contactEmail = info.contactEmail?.trim();
  if (contactEmail) return { href: `mailto:${contactEmail}`, channel: 'Email', label: '寫信給店長' };

  return null;
}
