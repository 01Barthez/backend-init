/**
 * Prisma + MongoDB soft-delete filter.
 *
 * `{ deletedAt: null }` only matches documents where the field is explicitly null.
 * Rows that never set `deletedAt` (field absent) do not match — so `findFirst`
 * after create returns null. Use this helper for "not soft-deleted" queries.
 */
export const prismaNotDeleted: {
  OR: Array<{ deletedAt: null } | { deletedAt: { isSet: false } }>;
} = {
  OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
};
