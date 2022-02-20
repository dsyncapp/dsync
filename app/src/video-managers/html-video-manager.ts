import * as video_manager from "./video-manager";

export const createHTMLVideoManager = (
  video: HTMLVideoElement,
  handler: video_manager.VideoEventHandler
): video_manager.VideoManager => {
  const lock = new Set<video_manager.PlayerEventType>();

  Object.values(video_manager.PlayerEventType).forEach((event) => {
    video.addEventListener(event, () => {
      if (lock.has(event)) {
        return lock.delete(event);
      }
      handler({
        type: event,
        status: {
          paused: video.paused,
          seeking: video.seeking,
          time: video.currentTime
        }
      });
    });
  });

  video.addEventListener("loadstart", () => {
    handler({
      type: video_manager.PlayerEventType.Ready,
      status: {
        paused: video.paused,
        seeking: video.seeking,
        time: video.currentTime
      }
    });
  });

  return {
    pause: () => {
      if (video.paused) {
        return;
      }
      console.log("pausing html video");
      lock.add(video_manager.PlayerEventType.Pause);
      video.pause();
    },

    resume: () => {
      if (!video.paused) {
        return;
      }
      console.log("resuming html video");
      lock.add(video_manager.PlayerEventType.Play);
      video.play();
    },

    seek: (time: number) => {
      console.log("seeking html video");
      lock.add(video_manager.PlayerEventType.Seeking);
      video.currentTime = time;
    },

    getState: () => {
      return new Promise((resolve) => {
        setImmediate(() => {
          resolve({
            paused: video.paused,
            seeking: video.seeking,
            time: video.currentTime
          });
        });
      });
    }
  };
};
