import * as video_manager from "../video-managers";
import * as React from "react";

type Props = {
  onEvent: video_manager.VideoEventHandler;
  url: string;
};

export const VideoSource = React.forwardRef<video_manager.VideoManager, Props>((props, ref) => {
  const video = React.useRef<HTMLVideoElement | null>(null);

  React.useEffect(() => {
    return () => {
      if (typeof ref === "function") {
        ref(null);
      } else if (ref) {
        ref.current = null;
      }
    };
  }, []);

  return (
    <video
      controls
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
