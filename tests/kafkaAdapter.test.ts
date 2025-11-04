import { KafkaAdapter } from "../src/lib/adapters/kafkaAdapter"
import { DEFAULT_CONFIG } from "../src/lib/config";
import { Kafka } from 'kafkajs';

 const mockConnect = jest.fn();
 const mockDisconnect = jest.fn();
 const mockSubscribe = jest.fn();
 const mockSend = jest.fn();
 const mockRun = jest.fn();
   

 jest.mock("kafkajs", () => ({
   Kafka: jest.fn().mockImplementation(() => ({
    consumer: jest.fn().mockReturnValue({
      connect: mockConnect,
      subscribe: mockSubscribe,
      run: mockRun,
      disconnect: mockDisconnect,
    }),
    producer: jest.fn().mockReturnValue({
      connect: jest.fn(),
      send: mockSend,
      disconnect: jest.fn(),
    }),
  })),
}));

describe("KafkaAdapter", () => {
  const adapter = new KafkaAdapter({});

  test("starts successfully", async () => {
    await adapter.start(async (msg: { value?: any | null }) => {
        return;
      })
     expect(mockConnect).toHaveBeenCalledTimes(1);
     expect(mockSubscribe).toHaveBeenCalledWith({ topic: DEFAULT_CONFIG.DEFAULT_KAFKA_TOPIC });
     expect(mockRun).toHaveBeenCalledTimes(1);
  });

  test("publishes messages succesfully", async () => {
    const msg = { id: 123, data: "test" };
    await adapter.publish(msg);
    expect(mockSend).toHaveBeenCalledWith({
      topic: DEFAULT_CONFIG.DEFAULT_KAFKA_TOPIC,
      messages: [{ value: JSON.stringify(msg) }],
    });
  });

  test("stops successfully", async () => {
    await adapter.stop();
     expect(mockDisconnect).toHaveBeenCalledTimes(1);
  });

});
