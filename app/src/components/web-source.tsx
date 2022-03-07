import * as player_managers from "../player-managers";
import * as constants from "../constants";
import * as api from "@dsyncapp/api";
import * as React from "react";

type Props = {
  onMount: (manager: api.player_managers.PlayerManager) => void;
  source: string;
};

export const WebSource: React.FC<Props> = (props, ref) => {
  const webview = React.useRef<HTMLWebViewElement | null>(null);

  return (
    <webview
      // @ts-ignore
      nodeintegrationinsubframes="true"
      ref={(element) => {
        if (element) {
          if (!webview.current) {
            props.onMount(player_managers.createWebViewPlayerManager(element));
            webview.current = element;

            element.addEventListener("enter-html-full-screen", () => {
              document.dispatchEvent(new Event("webview-enter-full-screen"));
            });
            element.addEventListener("leave-html-full-screen", () => {
              document.dispatchEvent(new Event("webview-exit-full-screen"));
            });
          }
        }
      }}
      style={{ width: "100%", height: "100%" }}
      src={props.source}
      preload={constants.ENV.WEBVIEW_PRELOAD_FILE}
    />
  );
};

export default WebSource;
