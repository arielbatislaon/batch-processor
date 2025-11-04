export const DEFAULT_CONFIG = {
  DEFAULT_BATCH_SIZE: 200,
  DEFAULT_MAX_WAIT_MS: 500,
  DEFAULT_CONCURRENCY: 8,
  DEFAULT_MAX_RETRIES: 5,
  DEFAULT_RETRY_DELAY_MS: 200,
  DEFAUL_CREATE_URL: "http://localhost:3000/api/data",
  DEFAULT_KAFKA_BROKERS: ["localhost:9092"],
  DEFAULT_KAFKA_TOPIC: "temperature-readings",
  DEFAULT_KAFKA_GROUP_ID: "temperature-service",
  DEFAULT_KAFKA_SSL: false,
  DEFAULT_KAFKA_SASL: {mechanism: 'plain',
                       username: 'your-username', // Replace with your SASL username
                        password: 'your-password', // Replace with your SASL password
                      },
  DEFAULT_REDIS_URL :"redis://localhost:6379",
  DEFAULT_REDIS_TTL_SECONDS: 86400, // 24 hours,
  DEFAUL_REDIS_PREFIX: "Cache:",
  DEFAULT_RABBITMQ_HOST: "localhost",
  DEFAULT_RABBITMQ_PORT: 5672,
  DEFAULT_RABBITMQ_USERNAME: "guest",
  DEFAULT_RABBITMQ_PASSWORD: "guest",
  DEFAULT_RABBITMQ_VHOST: "/",
  DEFAULT_RABBITMQ_QUEUE: "temperature-readings",
 };


