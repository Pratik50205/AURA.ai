import { NextRequest, NextResponse } from 'next/server';

export interface RateLimitOptions {
  limit?: number;        // Maximum number of requests allowed in window (default: 60)
  windowMs?: number;     // Window size in milliseconds (default: 60,000 = 1 minute)
  keyPrefix?: string;    // Custom prefix to namespace endpoints (e.g. 'recommend', 'assistant')
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetInSeconds: number;
}

interface ClientRecord {
  count: number;
  resetAt: number;
}

// In-memory rate limiting map
const clientRecords = new Map<string, ClientRecord>();
const MAX_TRACKED_IPS = 5000;
let lastCleanup = Date.now();

/**
 * Clean up expired client records to prevent memory growth.
 */
function cleanupExpiredRecords(now: number) {
  if (now - lastCleanup < 30_000 && clientRecords.size < MAX_TRACKED_IPS) {
    return;
  }
  lastCleanup = now;

  for (const [key, record] of clientRecords.entries()) {
    if (now > record.resetAt) {
      clientRecords.delete(key);
    }
  }

  // If still too large, prune oldest entries
  if (clientRecords.size >= MAX_TRACKED_IPS) {
    const keysToDelete = Array.from(clientRecords.keys()).slice(0, 1000);
    for (const key of keysToDelete) {
      clientRecords.delete(key);
    }
  }
}

/**
 * Extracts client IP from standard proxy headers or falls back to localhost.
 */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}

/**
 * Rate limits an incoming NextRequest.
 */
export function checkRateLimit(req: NextRequest, options: RateLimitOptions = {}): RateLimitResult {
  const limit = Math.max(1, options.limit ?? 60);
  const windowMs = Math.max(1000, options.windowMs ?? 60_000);
  const prefix = options.keyPrefix ? `${options.keyPrefix}:` : '';
  const ip = getClientIp(req);
  const key = `${prefix}${ip}`;

  const now = Date.now();
  cleanupExpiredRecords(now);

  const existing = clientRecords.get(key);

  if (!existing || now > existing.resetAt) {
    // New window
    clientRecords.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      success: true,
      limit,
      remaining: limit - 1,
      resetInSeconds: Math.ceil(windowMs / 1000),
    };
  }

  if (existing.count >= limit) {
    const resetInSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return {
      success: false,
      limit,
      remaining: 0,
      resetInSeconds,
    };
  }

  existing.count += 1;
  const resetInSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));

  return {
    success: true,
    limit,
    remaining: limit - existing.count,
    resetInSeconds,
  };
}

/**
 * Helper to construct an HTTP 429 Too Many Requests response with standard rate limit headers.
 */
export function buildRateLimitResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    {
      error: 'Too many requests. Please wait before making more requests.',
      retryAfter: result.resetInSeconds,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(result.resetInSeconds),
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(result.resetInSeconds),
      },
    }
  );
}
