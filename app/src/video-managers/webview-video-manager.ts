import * as video_manager from "./video-manager";

export enum IPCEventType {
  PlayerLoaded = "player-loaded",
  PlayerEvent = "player-event",

  GetStatus = "get-status",
  StatusResponse = "status-response",

  Pause = "pause",
  Play = "play",
  Seek = "seek"
}

export type PlayerLoadedEvent = {
  type: IPCEventType.PlayerLoaded;
  frame_id: string;
  player_details: {
    id: string;
    name: string;
    class_name: string
  };
};

export type EmittedPlayerEvent = {
  type: IPCEventType.PlayerEvent;
  event: video_manager.PlayerEventType;
  status: video_manager.PlayerStatus;
};

export type StatusCommand = {
  type: IPCEventType.Pause | IPCEventType.Play | IPCEventType.GetStatus;
};

export type StatusResponseEvent = {
  type: IPCEventType.StatusResponse;
  status: video_manager.PlayerStatus;
};

export type SeekCommand = {
  type: IPCEventType.Seek;
  time: number;
};

export type IPCEvent = PlayerLoadedEvent | EmittedPlayerEvent | StatusCommand | SeekCommand | StatusResponseEvent;

type RegisteredPlayer = {
  frame_id: string;
  id: string;
};

export const createWebViewVideoManager = (
  webview: HTMLWebViewElement,
  handler: video_manager.VideoEventHandler
): video_manager.VideoManager => {
  let player: RegisteredPlayer | undefined;

  let status_requests: Array<(status: video_manager.PlayerStatus) => void> = [];
  const getStatus = () => {
    return new Promise<video_manager.PlayerStatus>((resolve) => {
      status_requests.push(resolve);
      sendEvent({
        type: IPCEventType.GetStatus
      });
    });
  };

  webview.addEventListener("did-navigate", async (event: any) => {
    handler({
      type: video_manager.PlayerEventType.Navigate,

      status: await getStatus(),

      // @ts-ignore
      url: webview.getURL()
    });
  });

  webview.addEventListener("did-navigate-in-page", async (event: any) => {
    handler({
      type: video_manager.PlayerEventType.Navigate,

      status: await getStatus(),

      // @ts-ignore
      url: webview.getURL()
    });
  });

  webview.addEventListener("ipc-message", (message: any) => {
    if (message.channel !== "dsync") {
      return;
    }

    const event = message.args[0] as IPCEvent;

    if (event.type !== IPCEventType.PlayerLoaded) {
      if (message.frameId[1] !== player?.frame_id) {
        return;
      }
    }

    switch (event.type) {
      case IPCEventType.PlayerLoaded: {
        console.log(
          `Registering player [${JSON.stringify(event.player_details)}] on frame: ${event.frame_id} `
        );
        player = {
          frame_id: event.frame_id,
          id: event.player_details.id
        };
        return;
      }
      case IPCEventType.StatusResponse: {
        for (const request of status_requests) {
          request(event.status);
        }
        status_requests = [];
        return;
      }
      case IPCEventType.PlayerEvent: {
        return handler({
          type: event.event,
          status: event.status
        });
      }
    }
  });

  const sendEvent = (event: IPCEvent) => {
    if (!player) {
      return;
    }

    // @ts-ignore
    webview.sendToFrame(player.frame_id, "dsync", event);
  };

  return {
    pause: () => {
      console.log("pausing video");
      sendEvent({
        type: IPCEventType.Pause
      });
    },

    resume: () => {
      console.log("resuming video");
      sendEvent({
        type: IPCEventType.Play
      });
    },

    seek: (time: number) => {
      console.log("seeking");
      sendEvent({
        type: IPCEventType.Seek,
        time: time
      });
    },

    getState: getStatus
  };
};
