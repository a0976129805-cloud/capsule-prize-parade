/** Renders a DOM node to PNG with a timeout so share buttons never hang. */
export async function renderPng(node: HTMLElement, timeoutMs = 12000): Promise<Blob> {
  const { toBlob } = await import('html-to-image');
  const job = toBlob(node, { pixelRatio: 2, cacheBust: true, skipFonts: true, imagePlaceholder: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=' });
  const timer = new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), timeoutMs));
  const blob = await Promise.race([job, timer]);
  if (!blob) throw new Error('empty');
  return blob;
}

/** Shares a prepared file; falls back to download. Must be called directly in a tap handler. */
export async function shareOrDownload(file: File, share: boolean, meta: { title: string; text?: string }): Promise<'shared' | 'downloaded'> {
  if (share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: meta.title, ...(meta.text ? { text: meta.text } : {}) });
    return 'shared';
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a'); a.href = url; a.download = file.name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return 'downloaded';
}
