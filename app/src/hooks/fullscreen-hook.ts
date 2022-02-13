import * as React from "react";

export const useFullscreenObserver = () => {
  const [fullscreen, setFullscreen] = React.useState(false);

  React.useEffect(() => {
    const listener = () => {
      setFullscreen(document.fullscreenEnabled);
    };
    document.addEventListener("fullscreenchange", listener);
    return () => {
      document.removeEventListener("fullscreenchange", listener);
    };
  }, []);

  return fullscreen;
};
