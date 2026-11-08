/** Renders a DOM node to PNG with a timeout so share buttons never hang. */
export async function renderPng(node: HTMLElement, timeoutMs = 12000): Promise<Blob> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const job = async () => {
    await Promise.all(Array.from(node.querySelectorAll('img')).map(async img => {
      img.loading = 'eager';
      await img.decode();
      if (!img.naturalWidth) throw new Error('圖片尚未載入');
    }));
    const { toBlob } = await import('html-to-image');
    const clone = node.cloneNode(true) as HTMLElement;
    clone.setAttribute('data-export', 'true');
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--background').trim();
    const blob = await toBlob(clone, { pixelRatio: 2, skipFonts: true, width: node.offsetWidth, height: node.offsetHeight, backgroundColor: bg, style: { animation: 'none', opacity: '1', transform: 'none' } });
    if (!blob || !blob.size) throw new Error('empty');
    return blob;
  };
  try {
    return await Promise.race([job(), new Promise<never>((_, reject) => { timer=setTimeout(()=>reject(new Error('timeout')),timeoutMs); })]);
  } finally { if (timer) clearTimeout(timer); }
}

/** Shares a prepared file; falls back to download. Must be called directly in a tap handler. */
export async function shareOrDownload(file: File, share: boolean, meta: { title: string; text?: string }): Promise<'shared' | 'downloaded'> {
  if (share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: meta.title, ...(meta.text ? { text: meta.text } : {}) });
      return 'shared';
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') throw error;
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a'); a.href = url; a.download = file.name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return 'downloaded';
}
