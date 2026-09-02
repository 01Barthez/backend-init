import { readFileSync } from '@/shared/utils/fs-utils';

type CachedKeys = {
  accessPrivate: string;
  accessPublic: string;
  refreshPrivate: string;
  refreshPublic: string;
};

let cache: CachedKeys | null = null;

/**
 * Load RSA PEM material once. Auth sits on the hot path — do not hit disk
 * on every verify/sign.
 */
export const getJwtKeys = (paths: {
  accessPrivate: string;
  accessPublic: string;
  refreshPrivate: string;
  refreshPublic: string;
}): CachedKeys => {
  if (cache) return cache;

  const accessPrivate = readFileSync(paths.accessPrivate);
  const accessPublic = readFileSync(paths.accessPublic);
  const refreshPrivate = readFileSync(paths.refreshPrivate);
  const refreshPublic = readFileSync(paths.refreshPublic);

  if (!accessPrivate || !accessPublic || !refreshPrivate || !refreshPublic) {
    throw new Error('JWT key material is missing or empty — check JWT_*_KEY_PATH');
  }

  cache = { accessPrivate, accessPublic, refreshPrivate, refreshPublic };
  return cache;
};

/** Test helper — drop the in-process cache after rotating keys. */
export const resetJwtKeyCache = (): void => {
  cache = null;
};
