type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateLimitEntry>();

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  retryAfterMs: number;
}

export function rateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      retryAfterMs: 0,
    };
  }

  if (entry.count >= config.limit) {
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      retryAfterMs: entry.resetAt - now,
    };
  }

  entry.count++;
  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - entry.count,
    retryAfterMs: 0,
  };
}

export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  login: { limit: 5, windowMs: 60 * 1000 },
  register: { limit: 3, windowMs: 60 * 1000 },
  forgotPassword: { limit: 3, windowMs: 15 * 60 * 1000 },
  search: { limit: 30, windowMs: 60 * 1000 },
  api: { limit: 60, windowMs: 60 * 1000 },
};