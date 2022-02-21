import * as protocols from "@dsyncapp/protocols";
import * as video_manager from "./video-manager";

export const createHTMLVideoManager = (
  video: HTMLVideoElement,
  handler: video_manager.VideoEventHandler
): video_manager.VideoManager => {
  const lock = new Set<protocols.ipc.PlayerEventType>();

  Object.values(protocols.ipc.PlayerEventType).forEach((event) => {
    video.addEventListener(event, () => {
      if (lock.has(event)) {
        return lock.delete(event);
      }
      handler({
        type: event,
        state: {
          paused: video.paused,
          seeking: video.seeking,
          time: video.currentTime
        }
      });
    });
  });

  return {
    pause: () => {
      if (video.paused) {
        return;
      }
      console.log("pausing html video");
      lock.add(protocols.ipc.PlayerEventType.Pause);
      video.pause();
    },

    resume: () => {
      if (!video.paused) {
        return;
      }
      console.log("resuming html video");
      lock.add(protocols.ipc.PlayerEventType.Play);
      video.play();
    },

    seek: (time: number) => {
      console.log("seeking html video");
      lock.add(protocols.ipc.PlayerEventType.Seeking);
      video.currentTime = time;
    },

    getState: async () => {
      return {
        paused: video.paused,
        seeking: video.seeking,
        time: video.currentTime
      };
    }
  };
};
