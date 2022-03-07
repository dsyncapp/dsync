import * as player_managers from "../player-managers";
import * as api from "@dsyncapp/api";
import * as React from "react";

type Props = {
  url: string;
  onMount: (manager: api.player_managers.PlayerManager) => void;
};

export const VideoSource: React.FC<Props> = (props, ref) => {
  const video = React.useRef<HTMLVideoElement | null>(null);

  return (
    <video
      controls
      ref={(element) => {
        if (element) {
          if (!video.current) {
            props.onMount(player_managers.createHTMLPlayerManager(element));
            video.current = element;
          }
        }
      }}
      style={{ width: "100%", height: "100%" }}
      src={props.url}
    />
  );
};

export default VideoSource;
