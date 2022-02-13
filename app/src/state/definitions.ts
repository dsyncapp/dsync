import * as room_state from "../api/room-state";

export type Room = {
  id: string;
  state?: room_state.RoomState;
};
