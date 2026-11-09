import { Button } from '@/components/ui/button';
import { useAlbum } from './cat-album';
import { useMember } from './member-session';
import catLogo from '@/assets/cat-logo.png';

export function AlbumProgress({ deviceId, onOpen }: { deviceId: string | null; onOpen: () => void }) {
  const member = useMember();
  const album = useAlbum(deviceId);
  const count = new Set((album.data?.cards ?? []).map(c => c.no)).size;
  return <Button variant="bare" size="bare" className="album-btn flex shrink-0 items-center gap-1.5 rounded-full py-1 pl-1 pr-3 text-xs font-bold" onClick={onOpen}><img src={catLogo} alt="" className="h-7 w-7 rounded-full bg-card object-cover" /><span className="leading-tight">貓咪卡冊<span className="block text-[9px] font-medium">{!member.ready || album.isLoading ? '翻開收藏中…' : album.isError ? '查看收藏進度' : member.userId ? `🐾 已解鎖 ${count}/50` : '🐾 收集 50 張'}</span></span></Button>;
}