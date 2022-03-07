import * as protocols from "@dsyncapp/protocols";
import * as api from "@dsyncapp/api";
import * as uuid from "uuid";

export const createWebViewPlayerManager = (webview: HTMLWebViewElement): api.player_managers.PlayerManager => {
  const listeners = new Map<string, api.player_managers.PlayerEventHandler>();
  const emit = (event: api.player_managers.PlayerEvent) => {
    listeners.forEach((listener) => listener(event));
  };

  let player_id: string;

  const sendEvent = (event: protocols.ipc.IPCEvent) => {
    if (!player_id) {
      return;
    }
    // @ts-ignore
    webview.sendToFrame(Number(player_id), "dsync", event);
  };

  let status_requests: Array<(status: protocols.ipc.PlayerState) => void> = [];
  const getStatus = () => {
    return new Promise<protocols.ipc.PlayerState>((resolve) => {
      status_requests.push(resolve);
      sendEvent({
        type: "get-state",
        player_id: player_id
      });
    });
  };

  webview.addEventListener("did-navigate", async (event: any) => {
    emit({
      type: "navigate",
      // @ts-ignore
      url: webview.getURL()
    });
  });

  webview.addEventListener("did-navigate-in-page", async (event: any) => {
    emit({
      type: "navigate",
      // @ts-ignore
      url: webview.getURL()
    });
  });

  webview.addEventListener("ipc-message", (message: any) => {
    if (message.channel !== "dsync") {
      return;
    }

    const event = message.args[0] as protocols.ipc.IPCEvent;

    if (event.type !== "player-registered") {
      if (event.player_id !== player_id) {
        return;
      }
    }

    switch (event.type) {
      case "player-registered": {
        console.log(`Registering player ${event.player_id} `);
        player_id = event.player_id;
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

  return {
    play: () => {
      console.log("resuming video");
      sendEvent({
        type: "play",
        player_id: player_id
      });
    },

    pause: () => {
      console.log("pausing video");
      sendEvent({
        type: "pause",
        player_id: player_id
      });
    },

    seek: (time: number) => {
      console.log(`seeking to ${time}`);
      sendEvent({
        type: "seek",
        player_id: player_id,
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
