/**
 * Pure permission matching for string RBAC (`resource:action`).
 *
 * Convention:
 * - `:own` — scoped to resources the caller owns (enforced in use cases)
 * - `:any` — elevates past `:own` at the middleware gate
 *
 * Ownership checks stay in application commands; this helper only compares
 * permission strings so projects can swap in CASL/OPA later without rewriting routes.
 */
export function permissionSatisfied(
  granted: readonly string[],
  required: string,
): boolean {
  if (granted.includes(required)) {
    return true;
  }

  if (required.endsWith(':own')) {
    const elevated = required.replace(/:own$/, ':any');
    if (granted.includes(elevated)) {
      return true;
    }
  }

  return false;
}
