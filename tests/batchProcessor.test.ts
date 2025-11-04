import { BatchProcessor } from '../src/batchProcessor';
import type { Adapter, Message } from '../src/lib/types';

class DummyAdapter<T> implements Adapter<T> {
  private started = false;
  private startHandler?: (msg: Message<T>) => Promise<void>;
  private consumeHandler?: (message: T) => Promise<void>;

  async start(
    handler: (msg: Message<T>) => Promise<void>
  ): Promise<void> {
    this.started = true;
    this.startHandler = handler;
  }

  async stop(): Promise<void> {
    this.started = false;
    this.startHandler = undefined;
    this.consumeHandler = undefined;
  }

  // optional publish implementation: forwards payload into the same handler pipeline
  async publish(payload: T): Promise<void> {
    await this.push(payload);
  }

  async connect(): Promise<void> {
    // no-op for tests
  }

  async disconnect(): Promise<void> {
    // no-op for tests
  }

  async consume(handler: (message: T) => Promise<void>): Promise<void> {
    this.consumeHandler = handler;
  }

  // push a raw payload into the adapter. If a start handler was registered, it will be
  // called with a Message<T>-like object and an ack function. Otherwise falls back to consume().
  async push(msg: T): Promise<void> {
    if (this.startHandler) {
      // create a minimal Message<T>-shaped object. The real Message type may have more fields,
      // but for tests we only need to expose the payload.
      const message = { payload: msg } as unknown as Message<T>;
      const ack = async () => Promise.resolve();
      await this.startHandler(message);
    } else if (this.consumeHandler) {
      await this.consumeHandler(msg);
    } else {
      throw new Error('No handler registered to receive messages');
    }
  }
}



test('batches messages correctly', async () => {
  // use an object type that satisfies Record<string, any>
  const adapter = new DummyAdapter<{ n: number }>();
  const processed: number[][] = [];

  const bp = new BatchProcessor<{ n: number }>(
    {
      adapter,
      batchSize: 3,
      maxWaitMs: 50,
      onBatch: async (records: { n: number }[]) => {
        processed.push(records.map(r => r.n));
      },
    } as any
  );

  await bp.start();
  bp.enqueue({ n: 1 });
  bp.enqueue({ n: 2 });
  bp.enqueue({ n: 3 });
  await new Promise(r => setTimeout(r, 100));
  expect(processed.length).toBe(1);
  expect(processed[0]).toEqual([1, 2, 3]);
  await bp.stop();
});
