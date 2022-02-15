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

  return {
    pause: () => {
      console.log("pausing html video");
      lock.add(video_manager.PlayerEventType.Pause);
      video.pause();
    },

    resume: () => {
      console.log("resuming html video");
      lock.add(video_manager.PlayerEventType.Play);
      video.play();
    },

    seek: (time: number) => {
      console.log("seeking html video");
      lock.add(video_manager.PlayerEventType.Seeking);
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
