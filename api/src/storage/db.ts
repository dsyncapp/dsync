import * as rooms from "../rooms";
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

export const upsertRoom = async (room: rooms.Room) => {
  const db = await openDB();
  await db.put("rooms", {
    id: room.id,
    state: room.synced ? room.encode().toString("base64") : undefined
  });
  console.debug(`Persisted room ${room.id}`);
  db.close();
};

export const deleteRoom = async (room_id: string) => {
  const db = await openDB();
  await db.delete("rooms", room_id);
  console.debug(`Room ${room_id} deleted`);
  db.close();
};

export const getRooms = async (): Promise<rooms.Room[]> => {
  const db = await openDB();
  const serialized_rooms = await db.getAll("rooms");
  db.close();

  return serialized_rooms.map((room) => {
    return rooms.createRoom({
      id: room.id,
      state: room.state ? Buffer.from(room.state, "base64") : undefined
    });
  });
};
