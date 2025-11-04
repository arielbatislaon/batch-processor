import { BatchProcessorOptions, Adapter, CacheStore,Message } from '../types.js';
import { InMemoryAdapter } from '../adapters/inMemoryAdapter.js';
import { DEFAULT_CONFIG } from '../config.js';
import { InMemoryCacheStore } from "../cache.js";
import logger from '../logger.js';


export class BaseBatchOption<T> implements BatchProcessorOptions<T> {
  adapter: Adapter<T> = new InMemoryAdapter<T>();
  batchSize: number = DEFAULT_CONFIG.DEFAULT_BATCH_SIZE;
  flushIntervalMs: number = DEFAULT_CONFIG.DEFAULT_MAX_WAIT_MS;
  maxConcurrency: number = DEFAULT_CONFIG.DEFAULT_CONCURRENCY;
  Cache?: CacheStore<string> | undefined = new InMemoryCacheStore();
  onBatch: (batch: T[]) => Promise<void>;
  onError: (err: Error, batch: T[]) => void;
  getUniqueID:(msg:Message<T>) => Promise<string>;
  maxRetries: number = DEFAULT_CONFIG.DEFAULT_MAX_RETRIES;
  retryDelayMs: number = DEFAULT_CONFIG.DEFAULT_RETRY_DELAY_MS;
  createURL?: string = DEFAULT_CONFIG.DEFAUL_CREATE_URL;

  constructor(opts?: BatchProcessorOptions<any>) {
    // sensible defaults
    this.onBatch = async (batch: T[]) => {
      if (!this.createURL) {
        // If no URL is provided, treat as a no-op (or replace with real handler)
        console.warn('BaseBatchOption.onBatch: createURL not set — skipping batch');
        return;
      }

      const resp = await fetch(this.createURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(batch),
      });
      logger.info(`Sending batch of ${JSON.stringify(batch)} readings to ${this.createURL}`)

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
      }
    };

    this.onError = (err: Error, batch: T[]) => {
      console.error("❌ Error processing batch:", err, "Batch:", batch);
    };

    this.getUniqueID = (msg:Message<T>) => {
       const  retval =  async (msg:Message<T>) =>  {
          return await `${msg.value}-${msg.timestamp}`;
       };
      return retval(msg);
    }

    // apply overrides
    if (opts) {
      Object.assign(this, opts);
    }
  }

}