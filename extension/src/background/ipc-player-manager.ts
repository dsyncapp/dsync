import * as protocols from "@dsyncapp/protocols";
import * as api from "@dsyncapp/api";
import * as uuid from "uuid";

export const createIPCPlayerManager = (tab_id: number): api.player_managers.PlayerManager => {
  const listeners = new Map<string, api.player_managers.PlayerEventHandler>();
  const emit = (event: api.player_managers.PlayerEvent) => {
    listeners.forEach((listener) => listener(event));
  };

  let player_id: string | undefined;

  chrome.runtime.onMessage.addListener((event: protocols.ipc.IPCEvent, sender) => {
    if (sender.tab?.id !== tab_id) {
      return;
    }

    switch (event.type) {
      case "player-registered": {
        console.log(`Player ${event.player_id} registered on tab ${tab_id}`);
        player_id = event.player_id;
        return;
      }
      case "player-deregistered": {
        console.log(`Player ${event.player_id} deregistered on tab ${tab_id}`);
        player_id = undefined;
        return;
      }
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
    // if (!player_id) {
    //   return;
    // }
    chrome.tabs.sendMessage(tab_id, event, () => {});
  };

  let status_requests: Array<(status: protocols.ipc.PlayerState) => void> = [];
  const getStatus = async () => {
    // if (!player_id) {
    //   return {
    //     paused: true,
    //     seeking: false,
    //     time: -1
    //   };
    // }

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
