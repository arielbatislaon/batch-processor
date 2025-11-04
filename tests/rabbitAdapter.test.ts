const mockAssertQueue = jest.fn();
const mockConsume = jest.fn();
const mockSendToQueue = jest.fn();
const mockClose = jest.fn();
const mockCreateChannel = jest.fn().mockResolvedValue({
      assertQueue: mockAssertQueue,
      consume: mockConsume,
      ack: jest.fn(),
      sendToQueue: mockSendToQueue,
      close: mockClose,
    }); 
const mockConnect = jest.fn().mockResolvedValue({
      createChannel: mockCreateChannel,
      close: mockClose,
    });     

import { RabbitAdapter } from "../src/lib/adapters/RabbitAdapter";
import { DEFAULT_CONFIG } from "../src/lib/config";



jest.mock("amqplib", () => ({
  connect: mockConnect,
}));

describe("RabbitAdapter", () => {
    const adapter = new RabbitAdapter({})
 test("connects and consumes  successfully", async () => {
     await adapter.start(async (msg: { value?: any | null }) => {
         return;
       })
      expect(mockConnect).toHaveBeenCalledTimes(1);
      expect(mockCreateChannel).toHaveBeenCalledTimes(1);
      expect(mockAssertQueue).toHaveBeenCalledTimes(1);
      expect(mockConsume).toHaveBeenCalledTimes(1);
   });

  test("publishes messages", async () => {
    await adapter.publish([{ temp: 25 }]);
    expect(mockSendToQueue).toHaveBeenCalledWith(
      DEFAULT_CONFIG.DEFAULT_RABBITMQ_QUEUE,
      Buffer.from(JSON.stringify([{ temp: 25 }])),
      { persistent: true }
    );
  });
});
