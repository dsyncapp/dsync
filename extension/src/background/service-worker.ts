import * as ipc_player_manager from "./ipc-player-manager";
import * as api from "@dsyncapp/api";
import * as socket from "../socket";
import * as mobx from "mobx";
import * as uuid from "uuid";

const store = api.storage.createRoomStore();

type ActiveRoom = {
  tab_id: number;
  room_id: string;

  // source: string;
  // peers: Record<string, api.rooms.Peer>;
};

type BoundRoom = {
  dispose: () => void;
};

type State = {
  peer_id: string;
  active_room?: ActiveRoom;
};

const bound_rooms = new Map<string, BoundRoom>();
const state = mobx.observable<State>({
  peer_id: uuid.v4()
});

const sendStateToUI = (state: State) => {
  socket.sendMessage(socket.FromProcess.Background, {
    type: "state-changed",
    state: {
      rooms: Array.from(store.data.values()).map((room) => {
        return {
          id: room.id,
          name: room.getState().metadata.name || ""
        };
      }),
      active_room: state.active_room
        ? {
            id: state.active_room.room_id,
            name: store.data.get(state.active_room.room_id)?.getState().metadata.name,
            peers: {},
            source: ""
            // peers: state.active_room.peers,
            // source: state.active_room.source
          }
        : undefined
    }
  });
};

type InitializeRoomParams = {
  peer_id: string;

  room: api.rooms.Room;
  tab_id: number;
};

const bindRoomToTab = (params: InitializeRoomParams): BoundRoom => {
  const disposers: Array<() => void> = [];

  const env = require("../../env");

  const client = api.clients.createWebSocketClient({
    endpoint: env.API_ENDPOINT,
    room_id: params.room.id,
    peer_id: params.peer_id
  });
  const activation = api.rooms.activateRoom({
    room: params.room,
    peer_id: params.peer_id,
    client
  });

  const observer = params.room.observe((event) => {
    const url = event.current.metadata.source;
    if (url !== event.previous.metadata.source) {
      chrome.tabs.update(params.tab_id, {
        url
      });
    }
  });

  const binding = api.player_managers.bindPlayerToRoom({
    manager: ipc_player_manager.createIPCPlayerManager(params.tab_id),
    room: params.room,
    peer_id: params.peer_id
  });

  disposers.push(activation.shutdown, observer, client.disconnect, binding);

  return {
    dispose: () => {
      disposers.forEach((disposer) => disposer());
    }
  };
};

export const closeTab = async (id: number) => {
  const tabs = await chrome.tabs.query({});
  const tab = tabs.find((tab) => tab.id === id);
  if (tab) {
    await chrome.tabs.remove(id);
  }
};

const disposeActiveRoom = (state: State) => {
  const binding = bound_rooms.get(state.active_room?.room_id);
  binding.dispose();
  bound_rooms.delete(state.active_room?.room_id);
  closeTab(state.active_room?.tab_id);
  state.active_room = undefined;
};

const restartFromCheckpoint = async (active_room: ActiveRoom, peer_id: string): Promise<ActiveRoom | undefined> => {
  console.log("Restarting from checkpoint", active_room);

  const tab = await chrome.tabs.get(active_room.tab_id);
  if (!tab) {
    return;
  }

  const room = store.data.get(active_room.room_id);
  if (!room) {
    await chrome.tabs.remove(active_room.tab_id);
  }

  console.log("Active tab/room pair found. Reattaching");

  bound_rooms.set(
    room.id,
    bindRoomToTab({
      peer_id: peer_id,
      tab_id: active_room.tab_id,
      room
    })
  );

  return active_room;
};

const checkpoint = (state: State) => {
  const checkpoint = JSON.stringify({
    peer_id: state.peer_id,
    active_room: state.active_room
      ? {
          room_id: state.active_room.room_id,
          tab_id: state.active_room.tab_id
        }
      : undefined
  });
  console.log("Saving checkpoint", checkpoint);
  chrome.storage.local.set({ checkpoint });
};

void (async function () {
  await store.load();

  try {
    const result = await chrome.storage.local.get(["checkpoint"]);
    const checkpoint = JSON.parse(result.checkpoint);
    state.active_room = checkpoint.active_room;
    state.peer_id = checkpoint.peer_id || state.peer_id;
  } catch (err) {}

  if (state.active_room) {
    state.active_room = await restartFromCheckpoint(state.active_room, state.peer_id);
  }

  mobx.autorun(() => {
    sendStateToUI(state);
    checkpoint(state);
  });
})();

const injectContentScripts = async (tab_id: number) => {
  const tab = await chrome.tabs.get(tab_id);
  if (!tab.url.startsWith("https://")) {
    return;
  }

  console.log(`Injecting content scripts into ${tab_id}`);

  await chrome.scripting.executeScript({
    files: ["/dist/content/index.js"],
    target: {
      tabId: tab_id,
      allFrames: true
    }
  });
};

chrome.tabs.onRemoved.addListener((tab_id) => {
  if (state.active_room?.tab_id === tab_id) {
    console.log(`tab ${state.active_room.room_id}[${state.active_room.tab_id}] closed`);
    disposeActiveRoom(state);
  }
});

chrome.tabs.onUpdated.addListener(async (tab_id, info) => {
  if (state.active_room?.tab_id === tab_id) {
    if (info.status === "loading") {
      injectContentScripts(tab_id);
    }
  }
});

const createTab = async (source?: string) => {
  const tab = await chrome.tabs.create({
    active: true,
    url: source
  });

  return tab;
};

const joinRoom = async (room_id: string) => {
  console.log(`Got UI request to join room ${room_id}`);

  let room = store.data.get(room_id);
  if (!room) {
    room = store.join(room_id);
  }

  const room_state = room.getState();
  const new_tab = await createTab(room_state.metadata.source);

  bound_rooms.set(
    room.id,
    bindRoomToTab({
      peer_id: state.peer_id,
      room: room,
      tab_id: new_tab.id
    })
  );

  state.active_room = {
    room_id: room.id,
    tab_id: new_tab.id
  };
};

socket.subscribeToMessages(socket.FromProcess.UI, async (event, sender) => {
  switch (event.type) {
    case "get-state": {
      console.log("Got UI request for state");
      return sendStateToUI(state);
    }

    case "join-room": {
      return await joinRoom(event.room_id);
    }

    case "create-room": {
      const room = store.create(event.name);
      return await joinRoom(room.id);
    }

    case "delete-room": {
      if (state.active_room?.room_id === event.room_id) {
        disposeActiveRoom(state);
      }
      return store.delete(event.room_id);
    }

    case "leave-room": {
      console.log(`Got UI request to leave room ${event.room_id}`);
      disposeActiveRoom(state);
      return;
    }
  }
});

socket.subscribeToMessages(socket.FromProcess.ContentScript, async (event) => {
  switch (event.type) {
    case "new-iframe": {
      if (!state.active_room) {
        return;
      }
      return injectContentScripts(state.active_room.tab_id);
    }
  }
});
