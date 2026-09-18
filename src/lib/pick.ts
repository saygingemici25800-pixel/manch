/** Nesneden üst seviye anahtar alt kümesi (mesaj daraltma). */
export function pick<T extends Record<string, unknown>>(obj: T, keys: readonly string[]): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const k of keys) if (k in obj) out[k] = obj[k];
  return out as Partial<T>;
}
