import { Adapter, Message } from '../types';

export class InMemoryAdapter<T> implements Adapter<T> {
  async start(handler: (msg: Message<T>) => Promise<void>) { await handler({} as Message<T>); };
}