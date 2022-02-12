import * as video_manager from "../video-managers";
import * as React from "react";

type Props = video_manager.VideoManagerHooks & {
  url: string;
};

export const VideoSource = React.forwardRef<video_manager.VideoManager, Props>((props, ref) => {
  return (
    <video
      ref={(video) => {
        if (video) {
          const manager = video_manager.createHTMLVideoManager(video, props);

          if (ref) {
            if (typeof ref === "function") {
              ref(manager);
            } else {
              ref.current = manager;
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
