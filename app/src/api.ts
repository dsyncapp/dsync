import * as signaling_events from "@dsync/signaling-events";
import * as client from "./client";
import * as uuid from "uuid";
import * as y from "yjs";

export type Room = {
  id: string;
  document?: y.Doc;
};

export type ApplicationState = {
  rooms: Room[];
  active_room?: string;
};

type Listener = (state: ApplicationState) => void;

export const persistRoom = (room: Room) => {
  if (!room.document) {
    return;
  }
  localStorage.setItem(`room:${room.id}`, Buffer.from(y.encodeStateAsUpdate(room.document)).toString("base64"));
};

export const loadRoom = (id: string) => {
  const data = localStorage.getItem(`room:${id}`);
  if (!data) {
    return {
      id: id
    };
  }

  const doc = new y.Doc();

  y.applyUpdate(doc, Buffer.from(data, "base64"));

  return {
    id: id,
    document: doc
  };
};

export const loadKnownRooms = (): string[] => {
  const raw = localStorage.getItem("rooms");
  if (!raw) {
    return [];
  }
  return JSON.parse(raw);
};

export const appendKnownRooms = (id: string) => {
  const rooms = loadKnownRooms();
  rooms.push(id);
  localStorage.setItem("rooms", JSON.stringify(rooms));
  return rooms;
};

export const loadRooms = () => {
  const room_ids = loadKnownRooms();
  return room_ids.map((room_id) => {
    return loadRoom(room_id);
  });
};

const bindRoom = (client: client.SocketClient, room: Room) => {};

export class API {
  state: ApplicationState = {
    rooms: loadRooms()
  };

  listeners = new Map<string, Listener>();

  constructor(private client: client.SocketClient) {
    this.state.rooms.forEach((room) => {
      bindRoom(client, room);
    });

    this.client.subscribe((event) => {
      const room = this.state.rooms.find((room) => room.id === event.room_id);

      if (!room) {
        return;
      }

      if (!room.document) {
        if (!event.payload) {
          return;
        }

        let new_room = {
          id: room.id,
          document: new y.Doc()
        };

        y.applyUpdate(new_room.document, Buffer.from(event.payload.patch, "base64"));

        room.document = new y.Doc();
        return this.dispatch({
          rooms: this.state.rooms.filter((room) => room.id !== new_room.id).concat(new_room)
        });
      }

      if (!event.payload) {
        this.client.emit({
          type: signaling_events.EventType.Sync,
          room_id: event.room_id,
          payload: {
            vector: Buffer.from(y.encodeStateVector(room.document)).toString("base64"),
            patch: Buffer.from(y.encodeStateAsUpdate(room.document)).toString("base64")
          }
        });
        return;
      }

      y.applyUpdate(room.document, Buffer.from(event.payload.patch, "base64"));
    });
  }

  subscribe = (listener: Listener) => {
    const id = uuid.v4();
    this.listeners.set(id, listener);
    return () => {
      this.listeners.delete(id);
    };
  };

  dispatch = (state: Partial<ApplicationState>) => {
    this.state = {
      ...this.state,
      ...state
    };
    this.listeners.forEach((listener) => listener(this.state));
  };

  createRoom = () => {
    const id = uuid.v4();
    const doc = new y.Doc();

    const room = {
      id,
      document: doc
    };

    persistRoom(room);
    appendKnownRooms(id);
    bindRoom(this.client, room);

    this.dispatch({
      rooms: [...this.state.rooms, room]
    });

    this.activateRoom(room.id);
  };

  activateRoom = (id: string) => {
    if (this.state.active_room) {
      this.client.leave(id);
    }
    this.client.join(id);
    this.dispatch({
      active_room: id
    });
  };

  sync = (room_id: string) => {};
}
