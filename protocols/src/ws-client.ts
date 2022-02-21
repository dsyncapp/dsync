import * as codecs from "./codecs";
import * as async from "async";
import * as uuid from "uuid";

export type Listener<T> = (event: T) => void;

export type CreateSocketClientParams<T> = {
  endpoint: string;
  codec: codecs.Codec<T>;
  handshake?: (socket: WebSocket) => Promise<void> | void;

  onDisconnect?: () => void;
};

const createReadyPromise = (): [Promise<void>, () => void, () => void] => {
  let resolve: () => void;
  let reject: () => void;
  const promise = new Promise<void>((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });

  promise.catch(() => {});

  return [promise, resolve!, reject!];
};

export const createSocketClient = <T>(params: CreateSocketClientParams<T>) => {
  const listeners = new Map<string, Listener<T>>();

  let socket: WebSocket;
  let [ready, resolve, reject] = createReadyPromise();

  const connect = () => {
    socket = new WebSocket(params.endpoint);

    socket.onopen = async () => {
      await params.handshake?.(socket);
      resolve();
    };

    socket.onclose = () => {
      reject();
      [ready, resolve, reject] = createReadyPromise();
      setTimeout(() => {
        connect();
      }, 1000);

      params.onDisconnect?.();
    };

    socket.onmessage = async (message) => {
      const event = params.codec.decode(Buffer.from(await message.data.arrayBuffer()));
      listeners.forEach((listener) => listener(event));
    };
  };

  const queue = async.queue(async (event: T, done) => {
    try {
      await ready;
      if (socket.readyState === socket.OPEN) {
        socket.send(params.codec.encode(event));
      }
    } finally {
      done();
    }
  });

  connect();

  return {
    send: (event: T) => {
      queue.push(event);
    },
    subscribe: (handler: Listener<T>) => {
      const id = uuid.v4();
      listeners.set(id, handler);
      return () => {
        listeners.delete(id);
      };
    }
  };
};
