import { BatchProcessor } from "./batchProcessor.js";
import { BaseBatchOption } from "./lib/batch_options/baseBatchOption.js";
import { BatchProcessorOptions } from "./lib/types.js";

// Example usage:
async function main() {
  interface DeviceReading {
    sensorId: string;
    value: number;
    timestamp: number;
  }

 
  const createURL = "https://api.example.com/temperatures";
  const simulatedOnBatch = async (batch: DeviceReading[]) => {
    console.log(`Simulated sending batch of ${batch.length} readings to ${createURL}`)
  };  

  const batchProcessorOptions: BatchProcessorOptions<DeviceReading> = new BaseBatchOption();
  batchProcessorOptions.onBatch = simulatedOnBatch;

  const processor = new BatchProcessor<DeviceReading>(
  batchProcessorOptions, createURL);

  await processor.start();

  // Simulate incoming messages
  const myInterval = setInterval(() => {
    const reading: DeviceReading = {
      sensorId: `sensor-${Math.floor(Math.random() * 1000)}`,
      value: Math.random() * 100,
      timestamp: Date.now(),
    };
    if(processor.options.adapter.publish){// kafka and rabbitmq adapter has publish method
      processor.options.adapter.publish(reading).catch(console.error); // send teprature reading to kafka temperature-readings topic
    } else {
      processor.enqueue(reading);
    }
  }, 10);
  setTimeout(() => {
            clearInterval(myInterval);
            processor.stop();
        }, 5000);
}
main().catch((err) => console.error("Fatal error:", err));

