import * as video_manager from "../video-managers";
import * as protocols from "@dsyncapp/protocols";
import * as constants from "../constants";
import * as React from "react";

type Props = {
  onEvent: video_manager.VideoEventHandler;
  source: string;
};

export const ExtensionSource = React.forwardRef<video_manager.VideoManager, Props>((props, ref) => {
  const previous_source = React.useRef<string>();
  const manager = React.useRef<video_manager.VideoManager | null>(null);

  React.useEffect(() => {
    if (props.source === previous_source.current) {
      return;
    }

    ExtensionIPC.send({
      type: "set-source",
      source: props.source
    });

    previous_source.current = props.source;
  }, [props.source]);

  React.useEffect(() => {
    manager.current = video_manager.createExtensionVideoManager(props.onEvent);
    if (typeof ref === "function") {
      ref(manager.current);
    } else if (ref) {
      ref.current = manager.current;
    }

    return () => {
      if (typeof ref === "function") {
        ref(null);
      } else if (ref) {
        ref.current = null;
      }
    };
  }, []);

  return <div>Extension Source!</div>;
});

export default ExtensionSource;
