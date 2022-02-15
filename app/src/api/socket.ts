import * as signaling_events from "@dsyncapp/signaling-events";
import * as async from "async";
import * as uuid from "uuid";

export type Listener = (event: signaling_events.SyncEvent) => void;

export type CreateSocketClientParams = {
  endpoint: string;
  client_id: string;
  socket_id: string;
};

const createReadyPromise = (): [Promise<void>, () => void] => {
  let resolve: () => void;
  const promise = new Promise<void>((_r) => {
    resolve = _r;
  });
  return [promise, resolve!];
};

export const createSocketClient = (params: CreateSocketClientParams) => {
  const endpoint = `ws://${params.endpoint}`;

  const listeners = new Map<string, Listener>();
  const rooms = new Set<string>();

  let socket: WebSocket;
  let [ready, resolve] = createReadyPromise();

  const connect = () => {
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

      rooms.forEach((room) => {
        socket?.send(
          signaling_events.encode({
            type: signaling_events.EventType.Join,
            id: room
          })
        );
      });

      resolve();
    };

    socket.onclose = () => {
      [ready, resolve] = createReadyPromise();
      setTimeout(() => {
        connect();
      }, 1000);
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
    joinRoom: (room_id: string) => {
      rooms.add(room_id);
      queue.push({
        type: signaling_events.EventType.Join,
        id: room_id
      });
      return () => {
        rooms.delete(room_id);
        queue.push({
          type: signaling_events.EventType.Leave,
          id: room_id
        });
      };
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
