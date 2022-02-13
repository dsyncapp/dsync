import * as React from "react";

export const useFullscreenObserver = () => {
  const [fullscreen, setFullscreen] = React.useState(false);

  React.useEffect(() => {
    const listener = () => {};
    document.addEventListener("fullscreenchange", listener);

    const enterFullScreen = () => {
      setFullscreen(true);
    };
    document.addEventListener("webview-enter-full-screen", enterFullScreen);
    const exitFullScreen = () => {
      setFullscreen(false);
    };
    document.addEventListener("webview-exit-full-screen", exitFullScreen);

    return () => {
      document.removeEventListener("fullscreenchange", listener);
      document.removeEventListener("webview-enter-full-screen", enterFullScreen);
      document.removeEventListener("webview-exit-full-screen", exitFullScreen);
    };
  }, []);

  return fullscreen;
};
