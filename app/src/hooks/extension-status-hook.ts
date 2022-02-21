import * as React from "react";
import * as _ from "lodash";

export const useExtensionStatus = () => {
  const [status, setStatus] = React.useState<"connected" | "disconnected">("disconnected");

  React.useEffect(() => {
    const subscription = ExtensionIPC.subscribeToStatus((status) => {
      setStatus(status);
    });

    ExtensionIPC.getStatus();

    return subscription;
  }, []);

  return status;
};
