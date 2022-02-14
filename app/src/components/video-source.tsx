import * as video_manager from "../video-managers";
import * as React from "react";

type Props = {
  onEvent: video_manager.VideoEventHandler;
  url: string;
};

export const VideoSource = React.forwardRef<video_manager.VideoManager, Props>((props, ref) => {
  const video = React.useRef<HTMLVideoElement | null>(null);

  return (
    <video
      onClick={() => {
        if (video.current?.paused) {
          video.current.play();
        } else {
          video.current?.pause();
        }
      }}
      ref={(element) => {
        if (element) {
          if (!video.current || video.current !== element) {
            const manager = video_manager.createHTMLVideoManager(element, props.onEvent);
            video.current = element;

            if (ref) {
              if (typeof ref === "function") {
                ref(manager);
              } else {
                ref.current = manager;
              }
            }
          }
        }
      }}
      style={{ width: "100%", height: "100%" }}
      src={props.url}
    />
  );
});

export default VideoSource;
