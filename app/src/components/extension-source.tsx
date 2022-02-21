import * as video_manager from "../video-managers";
import * as protocols from "@dsyncapp/protocols";
import * as constants from "../constants";
import * as hooks from "../hooks";
import * as React from "react";
import * as uuid from "uuid";

type Props = {
  onEvent: video_manager.VideoEventHandler;
  source: string;
};

export const ExtensionSource = React.forwardRef<video_manager.VideoManager, Props>((props, ref) => {
  const tab_id = React.useMemo(() => uuid.v4(), []);

  const previous_status = React.useRef<"connected" | "disconnected">("disconnected");
  const extension_status = hooks.useExtensionStatus();

  const previous_source = React.useRef<string>();
  const manager = React.useRef<video_manager.ExtensionVideoManager | null>(null);

  React.useEffect(() => {
    if (extension_status === "disconnected") {
      return;
    }

    if (props.source === previous_source.current) {
      if (extension_status === previous_status.current) {
        return;
      }
    }

    ExtensionIPC.send({
      type: "upsert-tab",
      reference_id: tab_id,
      url: props.source
    });

    previous_source.current = props.source;
    previous_status.current = extension_status;
  }, [extension_status, props.source]);

  React.useEffect(() => {
    manager.current = video_manager.createExtensionVideoManager(tab_id, props.onEvent);
    if (typeof ref === "function") {
      ref(manager.current);
    } else if (ref) {
      ref.current = manager.current;
    }

    return () => {
      manager.current?.unmount();
      if (typeof ref === "function") {
        ref(null);
      } else if (ref) {
        ref.current = null;
      }
    };
  }, []);

  return <div>Extension Source! {extension_status}</div>;
});

export default ExtensionSource;
