import * as room_state from "./room-state";
import * as defs from "../state/definitions";
import * as idb from "idb";

export type SerializedRoom = {
  id: string;
  state?: string;
};

type DB = idb.IDBPDatabase<{
  rooms: {
    value: SerializedRoom;
    key: string;
  };
}>;

const openDB = (): Promise<DB> => {
  return idb.openDB("dsync", 1, {
    upgrade(db) {
      db.createObjectStore("rooms", {
        keyPath: "id"
      });
    }
  });
};

export const upsertRoom = async (room: defs.Room) => {
  const db = await openDB();
  await db.put("rooms", {
    ...room,
    state: room.state ? room.state.serialize().toString("base64") : undefined
  });
  console.debug("persisted change");
  db.close();
};

export const deleteRoom = async (room_id: string) => {
  const db = await openDB();
  await db.delete("rooms", room_id);
  console.debug("room deleted");
  db.close();
};

export const getRooms = async (): Promise<defs.Room[]> => {
  const db = await openDB();
  const rooms = await db.getAll("rooms");
  db.close();
  return rooms.map((room) => {
    return {
      ...room,
      state: room.state ? room_state.RoomState.deserialize(Buffer.from(room.state, "base64")) : undefined
    };
  });
};
