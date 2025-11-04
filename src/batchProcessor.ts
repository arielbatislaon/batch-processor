import logger from './lib/logger';
import { DEFAULT_CONFIG } from "./lib/config";
import { BatchProcessorOptions, Message, TemperatureReading } from "./lib/types";
import { BaseBatchOption } from "./lib/batch_options/baseBatchOption"
import { InMemoryAdapter } from './lib/adapters/inMemoryAdapter';

/**
 * Generic, high-performance batch processor
 * -----------------------------------------
 * Buffers incoming messages, groups them into batches,
 * processes them concurrently, and ensures Caching.
 */
export class BatchProcessor<T extends Record<string, any>>  {
  private readonly queue: T[] = [];
  private processing = false;
  public readonly options: BatchProcessorOptions<any>;
  private readonly timer?: NodeJS.Timeout;

  constructor(options?: BatchProcessorOptions<any>, createURL?: string) {
      const defaults = {
      batchSize: DEFAULT_CONFIG,
      flushIntervalMs: DEFAULT_CONFIG.DEFAULT_MAX_WAIT_MS,
      maxConcurrency: DEFAULT_CONFIG.DEFAULT_CONCURRENCY,
      maxRetries: DEFAULT_CONFIG.DEFAULT_MAX_RETRIES,
      retryDelayMs: DEFAULT_CONFIG.DEFAULT_RETRY_DELAY_MS,
      onError: (err: Error, _batch: T[]) => console.error(err),
    };
    if(options===undefined){
      const inMemoryAdapter = new InMemoryAdapter<TemperatureReading>();
      options  = new BaseBatchOption() as BatchProcessorOptions<TemperatureReading>;
      options.adapter = inMemoryAdapter;
    }
    this.options = {
      ...defaults,
      ...options,
    };
    this.options.createURL = createURL;

    // Start periodic flush
    this.timer = setInterval(() => this.flush(), this.options.flushIntervalMs);
  }

  async start(): Promise<void> {
    // Start adapter and wire incoming messages to the enqueue method.
      await this.options.adapter.start(async (msg: { value?: T | null }) => {
        if (msg && msg.value != null) {
          this.enqueue(msg.value);
        }
      });
      logger.info('BatchProcessor started');
  }

  stop(): void {
    clearInterval(this.timer);
    this.options.adapter.stop?.().catch(console.error);
    this.options.Cache?.close?.().catch(console.error);
    logger.info('BatchProcessor stopped');
  }

  enqueue(item: T): void {
    this.queue.push(item);
    if (this.queue.length >= (this.options.batchSize ?? 0)) {
      this.flush().catch(console.error);
    }
  }

  private async flush(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;

    const batch = this.queue.splice(0, this.options.batchSize);
    this.processBatch(batch)
      .catch((err) => {
        this.options.onError(err, batch);
      })
      .finally(() => {
        this.processing = false;
      });
  }

  private async processBatch(batch: T[]): Promise<void> {
    const uniqueBatch: T[] = [];

    if (this.options.Cache) {
      for (const item of batch) {
        //const id = `${item.sensorId}-${item.timestamp}`;
        const msg: Message<T>= { value: item, timestamp: Date.now() } ;
        const id = await this.options.getUniqueID(msg);
        const exists = await this.options.Cache.has(id);
        if (!exists) {
          uniqueBatch.push(item);
          await this.options.Cache.add(id);
        }
      }
    } else {
      uniqueBatch.push(...batch);
    }

    await this.executeWithRetries(uniqueBatch, this.options.maxRetries);
  }

  private async executeWithRetries(batch: T[], retriesLeft: number): Promise<void> {
    try {
      await this.options.onBatch(batch);
    } catch (err) {
      if (retriesLeft > 0) {
        await this.delay(this.options.retryDelayMs);
        return this.executeWithRetries(batch, retriesLeft - 1);
      } else {
        throw err;
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
