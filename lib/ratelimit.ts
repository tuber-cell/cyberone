import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

let redis: Redis | null = null
let anonLimiter: Ratelimit | null = null
let authLimiter: Ratelimit | null = null

function getRedis() {
  if (!redis && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  }
  return redis
}

export function getAnonLimiter() {
  const r = getRedis()
  if (!r) return null
  if (!anonLimiter) {
    anonLimiter = new Ratelimit({
      redis: r,
      limiter: Ratelimit.slidingWindow(1, '24 h'),
      prefix: 'cyberone:anon',
    })
  }
  return anonLimiter
}

export function getAuthLimiter() {
  const r = getRedis()
  if (!r) return null
  if (!authLimiter) {
    authLimiter = new Ratelimit({
      redis: r,
      limiter: Ratelimit.slidingWindow(3, '24 h'),
      prefix: 'cyberone:auth',
    })
  }
  return authLimiter
}

export async function checkRateLimit(
  identifier: string,
  isAuthenticated: boolean
): Promise<{ allowed: boolean; remaining: number; reset: number }> {
  const limiter = isAuthenticated ? getAuthLimiter() : getAnonLimiter()

  // If Redis not configured, allow all requests
  if (!limiter) {
    return { allowed: true, remaining: 999, reset: 0 }
  }

  const result = await limiter.limit(identifier)
  return {
    allowed: result.success,
    remaining: result.remaining,
    reset: result.reset,
  }
}
