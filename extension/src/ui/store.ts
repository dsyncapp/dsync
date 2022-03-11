import * as socket from "../socket";
import * as mobx from "mobx";

export const state = mobx.observable<socket.ExtensionState>({
  rooms: []
});

socket.subscribeToMessages(socket.FromProcess.Background, (event) => {
  if (event.type === "state-changed") {
    mobx.runInAction(() => {
      state.rooms = event.state.rooms;
      state.active_room = event.state.active_room;
    });
  }
});

export const loadRooms = () => {
  socket.sendMessage(socket.FromProcess.UI, {
    type: "get-state"
  });
};

export const leaveRoom = () => {
  if (!state.active_room) {
    return;
  }

  socket.sendMessage(socket.FromProcess.UI, {
    type: "leave-room",
    room_id: state.active_room.id
  });
};

export const joinRoom = (room_id: string) => {
  leaveRoom();

  socket.sendMessage(socket.FromProcess.UI, {
    type: "join-room",
    room_id: room_id
  });
};

export const createRoom = (name: string) => {
  socket.sendMessage(socket.FromProcess.UI, {
    type: "create-room",
    name
  });
};

export const deleteRoom = (room_id: string) => {
  socket.sendMessage(socket.FromProcess.UI, {
    type: "delete-room",
    room_id
  });
};
