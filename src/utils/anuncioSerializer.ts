export const LOCKED_FIELDS = [
  'adSnapshotUrl', 'adCopy', 'adHeadline', 'adCaption',
  'adDescription', 'libraryUrl', 'destinationUrl',
] as const;

export function maskAnuncio<T extends Record<string, any>>(anuncio: T, paid: boolean): T & { locked?: boolean } {
  if (paid) return anuncio;
  const masked: Record<string, any> = { ...anuncio, locked: true };
  for (const f of LOCKED_FIELDS) masked[f] = null;
  return masked as T & { locked: boolean };
}
