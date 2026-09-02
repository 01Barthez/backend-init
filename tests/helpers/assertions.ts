/**
 * Shared assertion helpers for API response envelopes.
 */
import { expect } from 'vitest';

export const expectErrorEnvelope = (body: unknown): void => {
  expect(body).toMatchObject({
    success: false,
    message: expect.any(String),
  });
};

export const expectSuccessEnvelope = (body: unknown): void => {
  expect(body).toMatchObject({
    success: true,
  });
};
