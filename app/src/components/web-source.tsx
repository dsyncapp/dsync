import * as video_manager from "../video-managers";
import * as React from "react";

type Props = video_manager.VideoManagerHooks & {
  source: string;
};

export const WebSource = React.forwardRef<video_manager.VideoManager, Props>((props, ref) => {
  const webview = React.useRef<HTMLWebViewElement | null>(null);

  return (
    <webview
      // @ts-ignore
      nodeintegrationinsubframes="true"
      ref={(element) => {
        webview.current = element;
        if (element) {
          const manager = video_manager.createWebViewVideoManager(element, props);

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
      src={props.source}
      preload={process.env.NEXT_PUBLIC_EXTENSION_PATH}
    />
  );
});

export default WebSource;
