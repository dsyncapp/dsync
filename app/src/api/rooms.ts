import * as signaling_events from "@dsyncapp/signaling-events";
import * as constants from "../constants";
import { RoomState } from "./room-state";
import * as state from "../state";
import * as uuid from "uuid";
import * as db from "./db";
import * as y from "yjs";

export const joinKnownRoom = (room_id: string) => {
  const room = state.Rooms.find((room) => room.id.value === room_id);
  if (!room) {
    return;
  }

  state.ActiveRoom.set(room_id);

  if (!room.state) {
    state.socket.emit({
      type: signaling_events.EventType.Sync,
      room_id: room_id,
      payload: null
    });
  }
};

export const leaveRoom = () => {
  state.ActiveRoom.set(null);
};

export const joinNewRoom = (room_id: string) => {
  const room = {
    id: room_id
  };

  db.upsertRoom(room);
  state.Rooms.merge([room]);

  joinKnownRoom(room.id);
};

const observers = new Map<string, () => void>();

export const observeRoom = (room: state.Room) => {
  console.log("observing room", room.id);
  if (!room.state) {
    return;
  }
  observers.get(room.id)?.();
  const observer = room.state.observe((patch, origin) => {
    if (origin === constants.process_id) {
      console.log("emitting to peers", `${patch.length}B`);
      state.socket.emit({
        type: signaling_events.EventType.Sync,
        room_id: room.id,
        payload: {
          vector: room.state!.createPatch().vector,
          patch: Buffer.from(patch).toString("base64")
        }
      });
    }
    db.upsertRoom(room);
  });
  observers.set(room.id, observer);
};

export const createRoom = (name: string) => {
  const id = uuid.v4();
  const doc = new y.Doc();

  const room = {
    id,
    state: new RoomState(doc)
  };

  room.state.setName(name);

  db.upsertRoom(room);
  state.Rooms.merge([room]);

  joinKnownRoom(room.id);
  observeRoom(room);
};

export const deleteRoom = (room_id: string) => {
  observers.get(room_id)?.();
  observers.delete(room_id);
  db.deleteRoom(room_id);
  state.Rooms.set(state.Rooms.value.filter((room) => room.id !== room_id));
};

export const startRoomSyncLoop = () => {
  const subscription = state.socket.subscribe((event) => {
    const room_state = state.Rooms.find((room) => room.id.value === event.room_id);
    const room = room_state?.value;

    if (!room) {
      return;
    }

    if (!room.state) {
      if (!event.payload) {
        return;
      }

      console.log("Received full sync from peer. Constructing room state")

      let new_room = {
        id: room.id,
        state: RoomState.deserialize(event.payload.patch)
      };

      room_state.merge(new_room);

      observeRoom(new_room);
      return;
    }

    if (!event.payload) {
      console.log("Peer requested full sync");
      state.socket.emit({
        type: signaling_events.EventType.Sync,
        room_id: event.room_id,
        payload: room.state.createPatch()
      });
      return;
    }

    room.state.applyPatch(event.payload.patch);
  });

  const interval = setInterval(() => {
    const room = state.Rooms.find((room) => room.id.value === state.ActiveRoom.value)?.value;
    if (!room || room.state) {
      return;
    }

    // const patch = room.state?.createPatch();
    // if (patch) {
    //   console.log(`emitting sync event with ${patch.patch.length}B`);
    // }

    state.socket.emit({
      type: signaling_events.EventType.Sync,
      room_id: room.id,
      payload: null
    });
  }, 5000);

  return () => {
    clearInterval(interval);
    subscription();
  };
};
