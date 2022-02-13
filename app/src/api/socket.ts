import * as signaling_events from "@dsyncapp/signaling-events";
import * as async from "async";
import * as uuid from "uuid";

export type Listener = (event: signaling_events.SyncEvent) => void;

export type CreateSocketClientParams = {
  endpoint: string;
  client_id: string;
  socket_id: string;
};

export const createSocketClient = (params: CreateSocketClientParams) => {
  const endpoint = `ws://${params.endpoint}`;

  const listeners = new Map<string, Listener>();

  let socket: WebSocket;
  let ready: Promise<void>;

  const connect = () => {
    let resolve: () => void;
    ready = new Promise((r) => {
      resolve = r;
    });

    socket = new WebSocket(endpoint);

    socket.onopen = () => {
      socket?.send(
        signaling_events.encode({
          type: signaling_events.EventType.Connect,
          client_id: params.client_id,
          socket_id: params.socket_id,
          name: "Lol"
        })
      );

      resolve();
    };

    socket.onclose = () => {
      connect();
    };

    socket.onmessage = (message) => {
      const event = signaling_events.decode(message.data.toString());
      if (event && event.type === signaling_events.EventType.Sync) {
        listeners.forEach((listener) => listener(event));
      }
    };
  };

  const queue = async.queue(async (event: signaling_events.Event, done) => {
    try {
      await ready;
      if (socket.readyState === socket.OPEN) {
        socket?.send(signaling_events.encode(event));
      } else {
        queue.unshift(event);
      }
    } finally {
      done();
    }
  });

  connect();

  return {
    emit: (event: signaling_events.Event) => {
      queue.push(event);
    },
    subscribe: (handler: Listener) => {
      const id = uuid.v4();
      listeners.set(id, handler);
      return () => {
        listeners.delete(id);
      };
    }
  };
};
