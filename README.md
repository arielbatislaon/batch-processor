# TypeScript Batch & Event Library

A high-performance, event-driven batch processing library that supports Kafka and RabbitMQ.

### Features

- Generic type-safe design (`BatchProcessor<T>`)
- 2000+ TPS scalable batching
- Backpressure and concurrency control
- Pluggable message queue adapters i.e. RabbitMQ, KAFKA adapters
- Pluggable caching and idempotency in REDIS 
- expandable default configuration and type 
- Graceful shutdown
- Jest unit tests

### Usage

```ts
import { BatchProcessor } from "./batchProcessor";
import { BaseBatchOption } from "./lib/batch_options/baseBatchOption";
import { BatchProcessorOptions } from "./lib/types";

interface TemperatureReading {
    sensorId: string;
    value: number;
    timestamp: number;
  }
const adapter = new KafkaAdapter<Order>({ brokers: ['kafka:9092'], topic: 'temperature-readings', groupId: 'temperature-service' });

const processor = new BatchProcessor<TemperatureReading>({
  adapter,
  batchSize: 500,
  onBatch: async (batch) => {
    console.log(`Processing ${batch.length} temperature reading batch`);
  },
});

await processor.start();
