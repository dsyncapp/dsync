import * as protocols from "@dsyncapp/protocols";
import * as api from "@dsyncapp/api";
import * as uuid from "uuid";

export const createIPCPlayerManager = (tab_id: number): api.player_managers.PlayerManager => {
  const listeners = new Map<string, api.player_managers.PlayerEventHandler>();
  const emit = (event: api.player_managers.PlayerEvent) => {
    listeners.forEach((listener) => listener(event));
  };

  let port: chrome.runtime.Port | undefined;

  chrome.runtime.onConnect.addListener((sock) => {
    if (tab_id !== sock.sender?.tab?.id) {
      return;
    }

    console.log(`Port ${sock.name} registered on tab ${tab_id}`);

    port?.disconnect();
    port = sock;

    sock.onDisconnect.addListener(() => {
      console.log(`Port ${sock.name} on tab ${tab_id} disconnected`);
      port = undefined;
    });

    sock.onMessage.addListener((event: protocols.ipc.IPCEvent) => {
      switch (event.type) {
        case "player-state": {
          for (const request of status_requests) {
            request(event.state);
          }
          status_requests = [];
          return;
        }
        case "player-event": {
          return emit(event.payload);
        }
      }
    });
  });

  chrome.tabs.onUpdated.addListener((changed_tab_id, info) => {
    if (changed_tab_id !== tab_id) {
      return;
    }

    if (info.status === "loading" && info.url) {
      console.log(`tab ${tab_id} navigated`, info.url);
      emit({
        type: "navigate",
        url: info.url
      });
    }
  });

  const sendEvent = (event: protocols.ipc.IPCEvent) => {
    if (!port) {
      return;
    }
    port.postMessage(event);
  };

  let status_requests: Array<(status: protocols.ipc.PlayerState) => void> = [];
  const getStatus = async () => {
    if (!port) {
      return {
        paused: true,
        seeking: false,
        time: -1
      };
    }

    return new Promise<protocols.ipc.PlayerState>((resolve) => {
      setTimeout(() => {
        resolve({
          paused: true,
          seeking: false,
          time: -1
        });
      }, 200);

      status_requests.push(resolve);
      sendEvent({
        type: "get-state",
        player_id: ""
      });
    });
  };

  return {
    play: () => {
      console.log("resuming video");
      sendEvent({
        type: "play",
        player_id: ""
      });
    },

    pause: () => {
      console.log("pausing video");
      sendEvent({
        type: "pause",
        player_id: ""
      });
    },

    seek: (time: number) => {
      console.log(`seeking to ${time}`);
      sendEvent({
        type: "seek",
        player_id: "",
        time: time
      });
    },

    getState: getStatus,

    subscribe: (listener) => {
      const id = uuid.v4();
      listeners.set(id, listener);
      return () => {
        listeners.delete(id);
      };
    }
  };
};
