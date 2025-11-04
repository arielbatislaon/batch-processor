import { createClient, RedisClientType } from 'redis';
import { DEFAULT_CONFIG } from './config';
import { CacheStore, CacheRecord } from './types';

/**
 * In-memory implementation — fast but not persistent.
 * Suitable for single-instance or test environments.
 */
export class InMemoryCacheStore implements CacheStore<string> {
  private store = new Map<string, CacheRecord>();
  private cleanupInterval: NodeJS.Timeout;

  constructor(private ttlSeconds: number = 300, cleanupIntervalMs: number = 60_000) {
    // Automatically clean up expired records periodically
    this.cleanupInterval = setInterval(() => this.clear, cleanupIntervalMs);
  }

  async has(key: string): Promise<boolean> {
    const record = this.store.get(key);

    if (record && Date.now() < record.expiresAt) {
      // Already processed and not expired
      return true;
    } else {
      return false
    }
   
  }

  async add(key: string): Promise<void> {
    const expiresAt = Date.now() + this.ttlSeconds * 1000;
    this.store.set(key, { key, createdAt: Date.now(), expiresAt });
  }

  async clear(): Promise<void> {
    const now = Date.now();
    let removed = 0;

    for (const [key, record] of this.store.entries()) {
      if (record.expiresAt <= now) {
        this.store.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      console.debug(`🧹 InMemoryCacheStore cleanup: removed ${removed} expired records`);
    }
  }

  async close(): Promise<void> {
    clearInterval(this.cleanupInterval)
  }  

}

/**
 * Redis-based implementation — scalable & persistent.
 * Suitable for distributed systems with many workers.
 */
export class RedisCacheStore implements CacheStore<string> {
  private readonly redis: RedisClientType;
  private readonly prefix: string;
  private readonly ttlSeconds: number;

  constructor(options: {
    url?: string;
    prefix?: string;
    ttlSeconds?: number; // how long to remember processed IDs
  }) {
    this.redis = createClient({ url: options.url || DEFAULT_CONFIG.DEFAULT_REDIS_URL });
    this.prefix = options.prefix ?? DEFAULT_CONFIG.DEFAUL_REDIS_PREFIX;
    this.ttlSeconds = options.ttlSeconds ?? DEFAULT_CONFIG.DEFAULT_REDIS_TTL_SECONDS; // default 24h
    this.redis.connect().catch(console.error);
  }

  private key(id: string): string {
    return `${this.prefix}${id}`;
  }

  async has(id: string): Promise<boolean> {
    const exists = await this.redis.exists(this.key(id));
    return exists === 1;
  }

  async add(id: string): Promise<void> {
    await this.redis.set(this.key(id), "1", { EX: this.ttlSeconds });
  }

  async clear(): Promise<void> {
    const keys = await this.redis.keys(`${this.prefix}*`);
    if (keys.length > 0) {
      await this.redis.del(keys);
    }
  }
  async close(): Promise<void> {
    await this.redis.quit();
  }  
}

