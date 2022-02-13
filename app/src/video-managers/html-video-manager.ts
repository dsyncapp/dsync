import * as video_manager from "./video-manager";

export const createHTMLVideoManager = (
  video: HTMLVideoElement,
  handler: video_manager.VideoEventHandler
): video_manager.VideoManager => {
  video.addEventListener("timeupdate", (event) => {
    console.log(event);
    console.log(video.currentTime);
  });

  return {
    pause: () => {
      console.log("pausing html video");
      video.pause();
    },

    resume: () => {
      console.log("resuming html video");
      video.play();
    },

    seek: (time: number) => {
      console.log("seeking html video");
      video.currentTime = time;
    },

    getState: async () => {
      return {
        paused: true,
        seeking: true,
        time: video.currentTime
      };
    }
  };
};
