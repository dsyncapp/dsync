import * as video_manager from "./video-manager";

type RegisteredPlayer = {
  id: string;
};

export const createExtensionVideoManager = (handler: video_manager.VideoEventHandler): video_manager.VideoManager => {
  let player: RegisteredPlayer | undefined;

  let status_requests: Array<(status: video_manager.PlayerStatus) => void> = [];
  const getStatus = () => {
    return new Promise<video_manager.PlayerStatus>((resolve) => {
      status_requests.push(resolve);
      ExtensionIPC.send({
        type: "get-status"
      });
    });
  };

  ExtensionIPC.subscribe((event) => {
    switch (event.type) {
      case "current-status": {
        for (const request of status_requests) {
          request(event.status);
        }
        status_requests = [];
        return;
      }
      case "player-event": {
        return handler(event.payload);
      }
    }
  });

  return {
    pause: () => {
      console.log("pausing video");
      ExtensionIPC.send({
        type: "pause"
      });
    },

    resume: () => {
      console.log("resuming video");
      ExtensionIPC.send({
        type: "play"
      });
    },

    seek: (time: number) => {
      console.log("seeking");
      ExtensionIPC.send({
        type: "seek",
        time: time
      });
    },

    getState: getStatus
  };
};
