import * as api from "@dsyncapp/api";
import * as mobx from "mobx";

const rooms = api.storage.createRoomStore();

type AppState = {
  active_room_id?: string;
  active_room?: api.rooms.Room;
  rooms: api.rooms.Room[];
};
export const state = mobx.observable<AppState>({
  get active_room() {
    if (!this.active_room_id) {
      return;
    }
    return rooms.data.get(this.active_room_id);
  },
  get rooms() {
    return Array.from(rooms.data.values());
  }
});

export const loadRooms = () => {
  return rooms.load();
};

export const joinRoom = (room_id: string) => {
  state.active_room_id = room_id;
};

export const joinNewRoom = (room_id: string) => {
  rooms.join(room_id);
  state.active_room_id = room_id;
};

export const leaveRoom = () => {
  state.active_room_id = undefined;
};

export const createRoom = (name: string) => {
  const room = rooms.create(name);
  state.active_room_id = room.id;
};

export const deleteRoom = (room_id: string) => {
  if (room_id === state.active_room_id) {
    leaveRoom();
  }
  const room = rooms.delete(room_id);
};
