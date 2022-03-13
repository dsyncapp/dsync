import * as fallback from "./fallback-controller";
import * as defs from "./definitions";

const injectSeekScript = () => {
  const script = document.createElement("script");

  script.innerHTML = `
window.addEventListener('message', function (event) {
  if (event.data.type !== 'dsyncapp-netflix-seek' || !event.data.time) {
    return;
  }

  const player_api = window.netflix.appContext.state.playerApp.getAPI().videoPlayer;
  const session_id = player_api.getAllPlayerSessionIds()[0];
  const player = player_api.getVideoPlayerBySessionId(session_id);
  player.seek(event.data.time * 1000);
}, false);
`;

  document.head.appendChild(script);
};

export const createNetflixController = (video: HTMLVideoElement): defs.PlayerController | undefined => {
  const controller = fallback.createFallbackController(video);

  injectSeekScript();

  return {
    ...controller,
    get state() {
      return controller.state;
    },
    seek: (time) => {
      window.postMessage(
        {
          type: "dsyncapp-netflix-seek",
          time: time
        },
        "https://www.netflix.com"
      );
    }
  };
};
