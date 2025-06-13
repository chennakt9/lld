type RateLimitConfig = {
  capacity: number;
  refillRatePerSecond: number;
  windowSizeInSec: number;
};

type TokenBucket = {
  tokens: number;
  lastRefill: number;
};

type SlidingWindowRecord = number[];

interface RateLimitStrategy {
  allowRequest(key: string): boolean;
}

class MemoryStore {
  private bucketStore = new  Map<string, TokenBucket>();
  private windowStore = new  Map<string, SlidingWindowRecord>();

  getBucket(key: string) {
    return this.bucketStore.get(key);
  }

  setBucket(key: string, bucket: TokenBucket) {
    this.bucketStore.set(key, bucket);
  }

  getWindow(key: string) {
    return this.windowStore.get(key) || [];
  }

  setWindow(key: string, bucket: SlidingWindowRecord) {
    return this.windowStore.set(key, bucket);
  }
}

// Another ref : https://blog.algomaster.io/p/rate-limiting-algorithms-explained-with-code
class TokenBucketStrategy implements RateLimitStrategy {
  constructor(
    public config: RateLimitConfig,
    public store: MemoryStore
  ) {}

  allowRequest(key: string): boolean {
    const now = Date.now();
    const bucket = this.store.getBucket(key) ?? {
      tokens: this.config.capacity,
      lastRefill: now,
    };

    const elapsed = (now - bucket.lastRefill) / 1000;
    const refill = Math.floor(elapsed * this.config.refillRatePerSecond);

    if (refill > 0) {
      bucket.tokens = Math.min(this.config.capacity, bucket.tokens + refill);
      bucket.lastRefill = now;
    }

    if (bucket.tokens > 0) {
      bucket.tokens -= 1;
      this.store.setBucket(key, bucket);
      return true;
    }

    return false;
  }
}

class SlidingWindowStrategy implements RateLimitStrategy {
  constructor(
    public config: RateLimitConfig,
    public store: MemoryStore
  ) {}

  allowRequest(key: string): boolean {
    const now = Date.now();
    const windowSizeMs = (this.config.windowSizeInSec ?? 60) * 1000;
    const record = this.store.getWindow(key).filter(ts => now - ts < windowSizeMs);

    if (record.length < this.config.capacity) {
      record.push(now);
      this.store.setWindow(key, record);
      return true;
    }

    return false;
  }
}

class RateLimiterService {
  constructor(
    public strategy: RateLimitStrategy
  ) {}

  handleRequest(key: string) {
    return this.strategy.allowRequest(key);
  }
}

// Driver code
const store = new MemoryStore();
const tokenLimiter = new RateLimiterService(new TokenBucketStrategy({ capacity: 5, refillRatePerSecond: 1, windowSizeInSec: 10 }, store));
const slidingLimiter = new RateLimiterService(new SlidingWindowStrategy({ capacity: 5, refillRatePerSecond: 1, windowSizeInSec: 10 }, store));

for (let i = 1; i <= 7; i++) {
  const allowedToken = tokenLimiter.handleRequest("user123");
  const allowedSlide = slidingLimiter.handleRequest("user456");
  console.log(`[Token] Request ${i}: ${allowedToken ? "SERVED" : "NOT-SERVED"}`);
  console.log(`[Sliding] Request ${i}: ${allowedSlide ? "SERVED" : "NOT-SERVED"}`);
}
