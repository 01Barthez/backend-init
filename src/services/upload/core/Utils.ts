export function extFromFilename(filename: string): string {
  const idx = filename.lastIndexOf('.');
  if (idx === -1) return '';
  return filename.slice(idx + 1).toLowerCase();
}

export function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

export function generateSafeFilename(originalName: string): string {
  // Extraire l'extension du fichier
  const ext = originalName.split('.').pop()?.toLowerCase() || '';

  // Nettoyer le nom du fichier (enlever les caractères spéciaux)
  const cleanName = originalName
    .replace(/\.[^/.]+$/, '') // Enlever l'extension existante
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-') // Remplacer les caractères spéciaux par des tirets
    .replace(/-+/g, '-') // Éviter les tirets multiples
    .replace(/^-+|-+$/g, ''); // Enlever les tirets en début et fin

  // Générer un UUID v4
  const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

  // Créer le nom de fichier final
  return `${uuid}-${cleanName}.${ext}`.substring(0, 255); // Limiter la longueur du nom de fichier
}

export function generateFilePath(originalName: string): { key: string; path: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  const safeName = generateSafeFilename(originalName);
  const key = `${year}/${month}/${day}/${safeName}`;

  return {
    key,
    path: `/${key}`,
  };
}
