import * as video_manager from "./video-manager";

export enum IPCEventType {
  PlayerLoaded = "player-loaded",
  Pause = "pause",
  Resume = "resume",
  Seek = "seek"
}

export type PlayerLoadedEvent = {
  type: IPCEventType.PlayerLoaded;
  frame_id: string;
};

export type PlayerStateEvent = {
  type: IPCEventType.Resume | IPCEventType.Pause;
};

export type PlayerSeekEvent = {
  type: IPCEventType.Seek;
  time: number;
};

export type IPCEvent = PlayerLoadedEvent | PlayerStateEvent | PlayerSeekEvent;

export const createWebViewVideoManager = (
  webview: HTMLWebViewElement,
  hooks: video_manager.VideoManagerHooks
): video_manager.VideoManager => {
  const frames = new Set<string>();

  webview.addEventListener("ipc-message", (message: any) => {
    if (message.channel !== "dsync") {
      return;
    }

    const event = message.args[0] as IPCEvent;

    switch (event.type) {
      case IPCEventType.PlayerLoaded: {
        console.log(`Registering player on frame: ${event.frame_id} [${message.frameId}]`);
        frames.add(event.frame_id);
        return;
      }
      case IPCEventType.Seek: {
        return hooks.onSeek(event.time);
      }
      case IPCEventType.Pause: {
        return hooks.onPause();
      }
      case IPCEventType.Resume: {
        return hooks.onResume();
      }
    }
  });

  const sendEvent = (event: IPCEvent) => {
    frames.forEach((frame_id) => {
      // @ts-ignore
      webview.sendToFrame(frame_id, "dsync", event);
    });
  };

  return {
    pause: () => {
      sendEvent({
        type: IPCEventType.Pause
      });
    },

    resume: () => {
      sendEvent({
        type: IPCEventType.Resume
      });
    },

    seek: (time: number) => {
      sendEvent({
        type: IPCEventType.Seek,
        time: time
      });
    }
  };
};
