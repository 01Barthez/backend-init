import axios, { type AxiosInstance } from 'axios';

export type SafeHttpClientOptions = {
  timeoutMs?: number;
  maxRedirects?: number;
  maxContentLengthBytes?: number;
};

/**
 * Outbound HTTP client with safe defaults for server-side calls.
 * SSRF hardening (private IP block) belongs here when URLs are user-controlled.
 */
export const createSafeHttpClient = (options: SafeHttpClientOptions = {}): AxiosInstance =>
  axios.create({
    timeout: options.timeoutMs ?? 10_000,
    maxRedirects: options.maxRedirects ?? 0,
    maxContentLength: options.maxContentLengthBytes ?? 1_048_576,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

export default createSafeHttpClient;
