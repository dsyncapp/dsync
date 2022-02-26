import * as protocols from "@dsyncapp/protocols";
import * as defs from "./definitions";

export const getPlayerState = (video: HTMLVideoElement): protocols.ipc.PlayerState => {
  return {
    paused: video.paused,
    seeking: video.seeking,
    time: video.currentTime
  };
};

export const createPlayerEventHandlers = (
  video: HTMLVideoElement,
  handler: (event: protocols.ipc.PlayerEvent) => void
) => {
  Object.values(protocols.ipc.PlayerEventType).map((event) => {
    video.addEventListener(event, () => {
      handler({
        type: event,
        state: getPlayerState(video)
      });
    });
  });
};

export const createFallbackController = (): defs.PlayerController | undefined => {
  const video = document.querySelector("video");
  if (!video) {
    return;
  }

  return {
    get state() {
      return getPlayerState(video);
    },

    pause: () => {
      if (!video.paused) {
        video.pause();
      }
    },
    play: () => {
      if (video.paused) {
        video.play();
      }
    },
    seek: (time) => {
      video.currentTime = time;
    },
    subscribe: (handler) => {
      createPlayerEventHandlers(video, handler);
    }
  };
};
