import { BatchProcessor } from "./batchProcessor";

// Example usage:
async function main() {
  interface TemperatureReading {
    sensorId: string;
    value: number;
    timestamp: number;
  }

  // Example Kafka adapter
  /*const kafkaAdapter = new KafkaAdapter<TemperatureReading>({
    brokers: ["localhost:9092"],
    topic: "temperature-readings",
    groupId: "temperature-service"
  }); */
  const createURL = "https://api.example.com/temperatures";
  //let batchProcessorOptions: BatchProcessorOptions<TemperatureReading> = new BaseBatchOption();
  //batchProcessorOptions.adapter = kafkaAdapter; // using Kafka adapter
  const processor = new BatchProcessor<TemperatureReading>(
  undefined, createURL);

  await processor.start();

  // Simulate incoming messages
  setInterval(() => {
    const reading: TemperatureReading = {
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
}

if (require.main === module) {
  main().catch((err) => console.error("Fatal error:", err));
}
