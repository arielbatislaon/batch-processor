import { Kafka } from 'kafkajs';
import { DEFAULT_CONFIG} from './../config.js';
import { Adapter, Message } from '../types.js';

export class KafkaAdapter<T> implements Adapter<T> {
  private kafka: Kafka;
  private topic: string;
  private groupId: string;
  private consumer: any;
  private producer: any;

  constructor({ brokers=DEFAULT_CONFIG.DEFAULT_KAFKA_BROKERS, topic=DEFAULT_CONFIG.DEFAULT_KAFKA_TOPIC, groupId=DEFAULT_CONFIG.DEFAULT_KAFKA_GROUP_ID, ssl=DEFAULT_CONFIG.DEFAULT_KAFKA_SSL,sasl=DEFAULT_CONFIG.DEFAULT_KAFKA_SASL }: { brokers?: string[]; topic?: string; groupId?: string; ssl? : boolean ;sasl ?: any;}) {
    this.kafka = new Kafka({ 
      brokers, 
      ssl,
      sasl
 });
    this.topic = topic;
    this.groupId = groupId;
  }

  async start(handler: (msg: Message<T>) => Promise<void>) {
    this.consumer = this.kafka.consumer({ groupId: this.groupId });
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: this.topic });
    await this.consumer.run({
      eachMessage: async (message: Message<T>) => {
        const value = message.value ? JSON.parse(message.value.toString()) : null;
        await handler({ value });
      }
    });
  }

  async stop() {
    await this.consumer.disconnect();
  }

  async publish(payload: T) {
    if (!this.producer) {
      this.producer = this.kafka.producer();
      await this.producer.connect();
    }
    await this.producer.send({
      topic: this.topic,
      messages: [{ value: JSON.stringify(payload) }],
    });
  }
}
