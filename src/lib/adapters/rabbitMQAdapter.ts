import amqp from  'amqplib';
import { Adapter, Message } from '../types';
import { DEFAULT_CONFIG } from '../config';

export class RabbitMQAdapter<T> implements Adapter<T> {
  private url: string;
  private queue: string;
  private conn: any;
  private ch: any;

  constructor({ url=`amqp://${DEFAULT_CONFIG.DEFAULT_RABBITMQ_USERNAME}:${DEFAULT_CONFIG.DEFAULT_RABBITMQ_PASSWORD}@${DEFAULT_CONFIG.DEFAULT_RABBITMQ_HOST}:${DEFAULT_CONFIG.DEFAULT_RABBITMQ_PORT}${DEFAULT_CONFIG.DEFAULT_RABBITMQ_VHOST}`, queue=DEFAULT_CONFIG.DEFAULT_RABBITMQ_QUEUE }: { url?: string; queue?: string }) {
    this.url = url;
    this.queue = queue;
  }

  async start(handler: (msg: Message<T>) => Promise<void>) {
    this.conn = await amqp.connect(this.url);
    this.ch = await this.conn.createChannel();
    await this.ch.assertQueue(this.queue, { durable: true });
    this.ch.consume(this.queue, async (msg: any) => {
      if (!msg) return;
      const content = JSON.parse(msg.content.toString());
      await handler({ value: content });
      this.ch.ack(msg);
    });
  }

  async stop() {
    await this.ch.close();
    await this.conn.close();
  }

  async publish(payload: T) {
    this.ch.sendToQueue(this.queue, Buffer.from(JSON.stringify(payload)), { persistent: true });
  }
}
