export interface LockPort {
  /** Returns an opaque lock token when acquired, null if another holder owns the key. */
  acquire(key: string, ttlMs: number): Promise<string | null>;
  release(key: string, token: string): Promise<void>;
}
