import * as rooms from "../rooms";
import * as uuid from "uuid";
import * as mobx from "mobx";
import * as db from "./db";
import * as y from "yjs";

const bindRoomToStorage = (room: rooms.Room) => {
  if (!room.state) {
    throw new Error("Can only bind a room with state");
  }

  console.log(`Binding room ${room.id} to storage`);

  return room.observe(() => {
    db.upsertRoom(room);
  });
};

export const createRoomStore = () => {
  const store = mobx.observable(new Map<string, rooms.Room>());
  const bindings = new Map<string, () => void>();

  mobx.autorun(() => {
    for (const room of store.values()) {
      if (!bindings.has(room.id) && room.state) {
        bindings.set(room.id, bindRoomToStorage(room));
      }

      for (const [id, binding] of bindings.entries()) {
        if (!store.has(id)) {
          binding();
          bindings.delete(id);
        }
      }
    }
  });

  return {
    data: store,

    load: async () => {
      const loaded = await db.getRooms();

      mobx.runInAction(() => {
        for (const room of loaded) {
          store.set(room.id, room);
        }
      });
    },
    create: (name: string) => {
      const id = uuid.v4();
      const doc = new y.Doc();

      const room = rooms.createRoom({
        id,
        state: doc
      });

      room.setName(name, "store");

      db.upsertRoom(room);
      store.set(room.id, room);

      return room;
    },
    join: (id: string) => {
      const room = rooms.createRoom({
        id
      });

      db.upsertRoom(room);
      store.set(room.id, room);

      return room;
    },
    delete: async (id: string) => {
      await db.deleteRoom(id);
      store.delete(id);
    }
  };
};
