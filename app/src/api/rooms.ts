import * as protocols from "@dsyncapp/protocols";
import * as crdt_utils from "./crdt-utils";
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
    state.socket.send({
      type: protocols.signaling.EventType.Sync,
      room_id: room_id
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
      console.debug("emitting to peers", `${patch.length}B`);
      state.socket.send({
        type: protocols.signaling.EventType.Sync,
        room_id: room.id,
        patch: Buffer.from(patch)
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
  state.Rooms.set((rooms) => rooms.filter((room) => room.id !== room_id));
};

export const startRoomSyncLoop = () => {
  const subscription = state.socket.subscribe((event) => {
    const room_state = state.Rooms.find((room) => room.id.value === event.room_id);
    const room = room_state?.value;

    if (!room) {
      return;
    }

    if (!room.state) {
      if (!event.patch) {
        return;
      }

      console.log("Received full sync from peer. Constructing room state");

      let new_room = {
        id: room.id,
        state: RoomState.deserialize(event.patch)
      };

      room_state.merge({
        state: new_room.state
      });

      observeRoom(new_room);
      return;
    }

    if (!event.patch && !event.vector) {
      console.log("Peer requested full sync");
      state.socket.send({
        type: protocols.signaling.EventType.Sync,
        room_id: event.room_id,
        patch: room.state.createPatch(),
        vector: room.state.getStateVector()
      });
      return;
    }

    if (event.patch) {
      room.state.applyPatch(event.patch);
      return;
    }

    if (event.vector) {
      if (!crdt_utils.stateVectorsAreEqual(event.vector, room.state.getStateVector())) {
        console.log("Peer vector is out of sync. Emitting missing difference");
        state.socket.send({
          type: protocols.signaling.EventType.Sync,
          room_id: event.room_id,
          patch: room.state.createPatch(event.vector)
        });
      }
      return;
    }
  });

  const interval = setInterval(() => {
    const room = state.Rooms.find((room) => room.id.value === state.ActiveRoom.value)?.value;
    if (!room) {
      return;
    }

    if (!room.state) {
      return state.socket.send({
        type: protocols.signaling.EventType.Sync,
        room_id: room.id
      });
    }

    const vector = room.state.getStateVector();
    state.socket.send({
      type: protocols.signaling.EventType.Sync,
      room_id: room.id,
      vector: vector
    });
  }, 5000);

  return () => {
    clearInterval(interval);
    subscription();
  };
};
