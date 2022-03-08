import * as ipc_player_manager from "./ipc-player-manager";
import * as browser from "webextension-polyfill";
import * as api from "@dsyncapp/api";
import * as socket from "./socket";
import * as mobx from "mobx";
import * as uuid from "uuid";

const peer_id = uuid.v4();

const store = api.storage.createRoomStore();

type ActiveRoom = {
  tab: browser.Tabs.Tab;
  room: api.rooms.Room;

  source: string;
  peers: Record<string, api.rooms.Peer>;

  dispose: () => void;
};

type State = {
  active_room?: ActiveRoom;
};

const state = mobx.observable<State>({});

const sendStateToUI = () => {
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
            id: state.active_room.room.id,
            peers: state.active_room.peers,
            source: state.active_room.source
          }
        : undefined
    }
  });
};

mobx.autorun(() => {
  sendStateToUI();
});

store.load();

const injectContentScripts = async (tab_id: number) => {
  await browser.tabs.executeScript(tab_id, {
    allFrames: true,
    file: "/dist/polyfill.js"
  });

  await browser.tabs.executeScript(tab_id, {
    allFrames: true,
    file: "/dist/content.js"
  });
};

browser.tabs.onRemoved.addListener((tab_id) => {
  if (state.active_room?.tab.id === tab_id) {
    console.log(`tab ${state.active_room.room.id}[${state.active_room.tab.id}] closed`);
    state.active_room.dispose();
  }
});

browser.tabs.onUpdated.addListener((tab_id, info) => {
  if (state.active_room?.tab.id === tab_id) {
    if (info.status === "loading") {
      injectContentScripts(tab_id);
    }
  }
});

const createTab = (source?: string) => {
  return new Promise<browser.Tabs.Tab>(async (resolve) => {
    const tab = await browser.tabs.create(
      {
        active: true,
        url: source
      },
      // @ts-ignore
      (tab) => {
        resolve(tab);
      }
    );
    if (tab) {
      resolve(tab);
    }
  });
};

const joinRoom = async (room_id: string) => {
  console.log(`Got UI request to join room ${room_id}`);

  let room = store.data.get(room_id);
  if (!room) {
    room = store.join(room_id);
  }

  const disposers: Array<() => void> = [];

  const client = api.clients.createWebSocketClient({
    endpoint: "ws://localhost:9987",
    room_id: room_id,
    peer_id
  });
  const activation = api.rooms.activateRoom({
    room,
    peer_id,
    client
  });

  const observer = room.observe((event) => {
    const url = event.current.metadata.source;
    if (url !== event.previous.metadata.source) {
      browser.tabs.update(new_tab.id, {
        url
      });
    }

    if (state.active_room) {
      state.active_room.peers = event.current.peers;
      state.active_room.source = event.current.metadata.source;
    }
  });

  const room_state = room.getState();
  console.log(room_state);

  const new_tab = await createTab(room_state.metadata.source);
  state.active_room = {
    tab: new_tab,
    room: room,

    source: room_state.metadata.source,
    peers: room_state.peers,

    dispose: async () => {
      state.active_room = undefined;
      disposers.forEach((disposer) => disposer());
      try {
        await browser.tabs.remove(new_tab.id);
      } catch (err) {}
    }
  };

  const binding = api.player_managers.bindPlayerToRoom({
    manager: ipc_player_manager.createIPCPlayerManager(new_tab.id),
    room: room,
    peer_id
  });

  disposers.push(activation.shutdown, observer, client.disconnect, binding);
};

socket.subscribeToMessages(socket.FromProcess.UI, async (event) => {
  switch (event.type) {
    case "get-state": {
      console.log("Got UI request for state");
      return sendStateToUI();
    }

    case "join-room": {
      return await joinRoom(event.room_id);
    }

    case "create-room": {
      const room = store.create(event.name);
      return await joinRoom(room.id);
    }

    case "delete-room": {
      if (state.active_room?.room.id === event.room_id) {
        state.active_room.dispose();
      }
      return store.delete(event.room_id);
    }

    case "leave-room": {
      console.log(`Got UI request to leave room ${event.room_id}`);
      state.active_room?.dispose();
    }
  }
});
