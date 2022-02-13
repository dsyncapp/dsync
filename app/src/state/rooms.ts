import * as hookstate from "@hookstate/core";
import * as defs from "./definitions";

export type ApplicationState = {
  rooms: defs.Room[];
  active_room?: string;
};

export const ActiveRoom = hookstate.createState<string | null>(null);
export const Rooms = hookstate.createState<defs.Room[]>([]);

export const useRooms = () => {
  const rooms = hookstate.useState(Rooms);
  const room_id = hookstate.useState(ActiveRoom);

  const room = rooms.find((room) => room.id.value === room_id.value);

  return {
    rooms: rooms.value,
    room: room?.value
  };
};
