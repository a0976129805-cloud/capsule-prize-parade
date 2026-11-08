export function validateAlbumMerge(d: { deviceId: string; confirmed: boolean }) {
  if (d.confirmed !== true || !d.deviceId || d.deviceId.length > 80) throw new Error('請先確認合併卡片');
  return { deviceId: d.deviceId };
}