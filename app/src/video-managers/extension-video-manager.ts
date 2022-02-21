import * as protocols from "@dsyncapp/protocols";
import * as video_manager from "./video-manager";

export type ExtensionVideoManager = video_manager.VideoManager & {
  unmount: () => void;
};

export const createExtensionVideoManager = (
  reference_id: string,
  handler: video_manager.VideoEventHandler
): ExtensionVideoManager => {
  let player_id: string;

  let status_requests: Array<(status: protocols.ipc.PlayerState) => void> = [];
  const getStatus = () => {
    return new Promise<protocols.ipc.PlayerState>((resolve) => {
      status_requests.push(resolve);
      ExtensionIPC.send({
        type: "get-state",
        reference_id,
        player_id
      });
    });
  };

  const subscription = ExtensionIPC.subscribe((event) => {
    if (event.reference_id !== reference_id) {
      return;
    }

    switch (event.type) {
      case "player-registered": {
        player_id = event.player_id;
        return;
      }
      case "player-state": {
        if (event.player_id !== player_id) {
          return;
        }
        for (const request of status_requests) {
          request(event.state);
        }
        status_requests = [];
        return;
      }
      case "player-event": {
        if (event.player_id !== player_id) {
          return;
        }
        return handler(event.payload);
      }
      case "player-deregistered": {
        if (player_id === event.player_id) {
          player_id = "";
        }
      }
    }
  });

  return {
    pause: () => {
      console.log("pausing video");
      ExtensionIPC.send({
        type: "pause",
        reference_id,
        player_id
      });
    },

    resume: () => {
      console.log("resuming video");
      ExtensionIPC.send({
        type: "play",
        reference_id,
        player_id
      });
    },

    seek: (time: number) => {
      console.log("seeking");
      ExtensionIPC.send({
        type: "seek",
        time: time,
        reference_id,
        player_id
      });
    },

    getState: getStatus,

    unmount: () => {
      subscription();
      ExtensionIPC.send({
        type: "close-tab",
        reference_id: reference_id
      });
    }
  };
};
