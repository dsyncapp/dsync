import * as signaling_events from "@dsyncapp/signaling-events";
import { RoomState } from "./room-state";
import * as client from "./client";
import * as uuid from "uuid";
import * as y from "yjs";

export type Room = {
  id: string;
  state?: RoomState;
};

export type ApplicationState = {
  rooms: Room[];
  active_room?: string;
};

type Listener = (state: ApplicationState) => void;

export const persistRoom = (room: Room) => {
  if (!room.state) {
    return;
  }
  localStorage.setItem(`room:${room.id}`, room.state.serialize());
};

export const loadRoom = (id: string, socket_id: string) => {
  const data = localStorage.getItem(`room:${id}`);
  if (!data) {
    return {
      id: id
    };
  }

  return {
    id: id,
    state: RoomState.deserialize(data, socket_id)
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

export const loadRooms = (socket_id: string) => {
  const room_ids = loadKnownRooms();
  return room_ids.map((room_id) => {
    return loadRoom(room_id, socket_id);
  });
};

const bindRoom = (client: client.SocketClient, room: Room) => {
  // room.
  // room.document?.on("update", (_u: any, _o: any, doc: y.Doc) => {
  //   client.sync(room.id);
  // });
};

export class API {
  state: ApplicationState;

  listeners = new Map<string, Listener>();

  constructor(private client: client.SocketClient) {
    this.state = {
      rooms: loadRooms(client.socket_id)
    };

    this.client.subscribe((event) => {
      const room = this.state.rooms.find((room) => room.id === event.room_id);

      if (!room) {
        return;
      }

      if (!room.state) {
        if (!event.payload) {
          return;
        }

        let new_room = {
          id: room.id,
          state: RoomState.deserialize(event.payload.patch, this.client.socket_id)
        };

        return this.dispatch({
          rooms: this.state.rooms.filter((room) => room.id !== new_room.id).concat(new_room)
        });
      }

      if (!event.payload) {
        this.client.emit({
          type: signaling_events.EventType.Sync,
          room_id: event.room_id,
          payload: room.state.createPatch()
        });
        return;
      }

      room.state.applyPatch(event.payload.patch);
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
      state: new RoomState(doc, this.client.socket_id)
    };

    persistRoom(room);
    appendKnownRooms(id);

    this.dispatch({
      rooms: [...this.state.rooms, room]
    });

    this.activateRoom(room.id);
  };

  observer: (() => void) | undefined;
  activateRoom = (id: string) => {
    const room = this.state.rooms.find((room) => room.id === id);
    if (!room) {
      return;
    }

    if (this.state.active_room) {
      this.observer?.();
      this.client.leave(id);
    }
    this.client.join(id);
    // this.observer = room.state?.observe(() => {

    // })
    this.dispatch({
      active_room: id
    });
  };

  joinRoom = (room_id: string) => {
    const room = {
      id: room_id
    };

    persistRoom(room);
    appendKnownRooms(room.id);

    this.dispatch({
      rooms: this.state.rooms
        .filter((room) => room.id !== room_id)
        .concat({
          id: room_id
        })
    });

    this.activateRoom(room.id);
  };

  sync = (room_id: string) => {
    const room = this.state.rooms.find((room) => room.id === room_id);
    if (!room) {
      return;
    }

    this.client.emit({
      type: signaling_events.EventType.Sync,
      room_id: room.id,
      payload: room.state?.createPatch() || null
    });
  };
}
