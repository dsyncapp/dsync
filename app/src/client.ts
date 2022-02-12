import * as signaling_events from "@dsyncapp/signaling-events";
import * as async from "async";
import * as uuid from "uuid";

type Listener = (event: signaling_events.SyncEvent) => void;

export class SocketClient {
  socket_id = uuid.v4();

  socket?: WebSocket;
  ready?: Promise<void>;

  listeners = new Map<string, Listener>();

  constructor(private endpoint: string, private client_id: string) {
    this.init();
  }

  init() {
    let resolve: () => void;
    this.ready = new Promise((r) => {
      resolve = r;
    });

    this.socket = new WebSocket(`ws://${this.endpoint}`);

    this.socket.onopen = () => {
      this.socket!.send(
        signaling_events.encode({
          type: signaling_events.EventType.Connect,
          client_id: this.client_id,
          socket_id: this.socket_id,
          name: "Lol"
        })
      );

      resolve();
    };

    this.socket.onclose = () => {
      this.init();
    };

    this.socket.onmessage = (message) => {
      const event = signaling_events.decode(message.data.toString());
      if (event && event.type === signaling_events.EventType.Sync) {
        this.listeners.forEach((listener) => listener(event));
      }
    };
  }

  queue = async.queue(async (event: signaling_events.Event, done) => {
    try {
      await this.ready;
      this.socket?.send(signaling_events.encode(event));
    } finally {
      done();
    }
  });

  emit = (event: signaling_events.Event) => {
    this.queue.push(event);
  };

  subscribe = (handler: Listener) => {
    const id = uuid.v4();
    this.listeners.set(id, handler);
    return () => {
      this.listeners.delete(id);
    };
  };

  sync = (room_id: string, payload?: signaling_events.SyncEventPayload) => {
    this.queue.push({
      type: signaling_events.EventType.Sync,
      room_id: room_id,
      payload: payload || null
    });
  };

  join = (room_id: string) => {
    this.queue.push({
      type: signaling_events.EventType.Join,
      id: room_id
    });
  };

  leave = (room_id: string) => {
    this.queue.push({
      type: signaling_events.EventType.Leave,
      id: room_id
    });
  };
}
