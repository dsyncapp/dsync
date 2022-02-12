import * as video_manager from "./video-manager";

export const createHTMLVideoManager = (
  video: HTMLVideoElement,
  hooks: video_manager.VideoManagerHooks
): video_manager.VideoManager => {
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
      video.currentTime = time;
    }
  };
};
