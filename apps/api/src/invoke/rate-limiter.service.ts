import { Injectable } from '@nestjs/common';

/**
 * Simple in-memory token bucket rate limiter.
 * 
 * TODO: For multi-instance deployments, replace with Redis-backed implementation.
 * This in-memory version will not share state across instances.
 */

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

// Default: 60 requests per minute
const DEFAULT_MAX_TOKENS = 60;
const DEFAULT_REFILL_RATE = 1; // tokens per second
const DEFAULT_REFILL_INTERVAL = 1000; // ms

@Injectable()
export class RateLimiterService {
  private buckets: Map<string, TokenBucket> = new Map();

  /**
   * Check if a request is allowed and consume a token if so.
   * @returns true if allowed, false if rate limited
   */
  consume(agentKeyId: string, toolId: string): boolean {
    const key = `${agentKeyId}:${toolId}`;
    const now = Date.now();

    let bucket = this.buckets.get(key);
    if (!bucket) {
      bucket = {
        tokens: DEFAULT_MAX_TOKENS,
        lastRefill: now,
      };
      this.buckets.set(key, bucket);
    }

    // Refill tokens based on time elapsed
    const elapsed = now - bucket.lastRefill;
    const tokensToAdd = Math.floor(elapsed / DEFAULT_REFILL_INTERVAL) * DEFAULT_REFILL_RATE;
    
    if (tokensToAdd > 0) {
      bucket.tokens = Math.min(DEFAULT_MAX_TOKENS, bucket.tokens + tokensToAdd);
      bucket.lastRefill = now;
    }

    // Check if we have tokens available
    if (bucket.tokens > 0) {
      bucket.tokens--;
      return true;
    }

    return false;
  }

  /**
   * Get remaining tokens for a bucket (for informational purposes)
   */
  getRemaining(agentKeyId: string, toolId: string): number {
    const key = `${agentKeyId}:${toolId}`;
    const bucket = this.buckets.get(key);
    return bucket?.tokens ?? DEFAULT_MAX_TOKENS;
  }

  /**
   * Clear all buckets (for testing)
   */
  clear(): void {
    this.buckets.clear();
  }
}
