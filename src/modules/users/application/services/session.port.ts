/**
 * Session / security operations owned by auth, called from users lifecycle flows.
 * Keeps JWT/blacklist details out of the users domain.
 */
export interface SessionPort {
  /** Revoke every refresh family (admin deactivate, self-delete, force logout). */
  revokeAllForUser(userId: string): Promise<void>;

  /** Opaque reset token (raw) for invite / set-password emails. */
  createPasswordResetToken(userId: string): Promise<string>;
}
