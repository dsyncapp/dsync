import * as video_manager from "../video-managers";
import * as React from "react";

type Props = {
  onEvent: video_manager.VideoEventHandler;
  source: string;
};

export const WebSource = React.forwardRef<video_manager.VideoManager, Props>((props, ref) => {
  const webview = React.useRef<HTMLWebViewElement | null>(null);
  const manager = React.useRef<video_manager.VideoManager | null>(null);

  return (
    <webview
      // @ts-ignore
      nodeintegrationinsubframes="true"
      ref={(element) => {
        if (element) {
          if (!webview.current || webview.current !== element) {
            console.log("creating new web view video manager");
            manager.current = video_manager.createWebViewVideoManager(element, props.onEvent);
            webview.current = element;

            element.addEventListener("enter-html-full-screen", () => {
              document.dispatchEvent(new Event("webview-enter-full-screen"));
            });
            element.addEventListener("leave-html-full-screen", () => {
              document.dispatchEvent(new Event("webview-exit-full-screen"));
            });
          }

          if (ref) {
            if (typeof ref === "function") {
              ref(manager.current);
            } else {
              ref.current = manager.current;
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
