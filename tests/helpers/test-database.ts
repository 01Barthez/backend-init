/**
 * Test database helpers.
 * Extend with Prisma test DB setup when integration tests require a live database.
 */

export const setupTestDatabase = async (): Promise<void> => {
  // Placeholder: connect to test MongoDB instance when needed
};

export const cleanUpTestDatabase = async (_dropAll = false): Promise<void> => {
  // Placeholder: reset test collections between tests
};
