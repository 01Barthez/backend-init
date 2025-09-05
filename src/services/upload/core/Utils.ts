export function extFromFilename(filename: string): string {
  const idx = filename.lastIndexOf('.');
  if (idx === -1) return '';
  return filename.slice(idx + 1).toLowerCase();
}

export function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}
