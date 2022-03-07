import * as protocols from "@dsyncapp/protocols";
import * as api from "@dsyncapp/api";
import * as uuid from "uuid";

export const createHTMLPlayerManager = (video: HTMLVideoElement): api.player_managers.PlayerManager => {
  const lock = new Set<protocols.ipc.PlayerEventType>();
  const listeners = new Map<string, api.player_managers.PlayerEventHandler>();

  Object.values(protocols.ipc.PlayerEventType).forEach((event) => {
    video.addEventListener(event, () => {
      if (lock.has(event)) {
        return lock.delete(event);
      }
      listeners.forEach((listener) => {
        listener({
          type: event,
          state: {
            paused: video.paused,
            seeking: video.seeking,
            time: video.currentTime
          }
        });
      });
    });
  });

  return {
    play: () => {
      if (!video.paused) {
        return;
      }
      console.log("resuming html video");
      lock.add(protocols.ipc.PlayerEventType.Play);
      video.play();
    },

    pause: () => {
      if (video.paused) {
        return;
      }
      console.log("pausing html video");
      lock.add(protocols.ipc.PlayerEventType.Pause);
      video.pause();
    },

    seek: (time: number) => {
      console.log("seeking html video");
      lock.add(protocols.ipc.PlayerEventType.Seeking);
      video.currentTime = time;
    },

    getState: async () => {
      return {
        paused: video.paused,
        seeking: video.seeking,
        time: video.currentTime
      };
    },

    subscribe: (listener) => {
      const id = uuid.v4();
      listeners.set(id, listener);
      return () => {
        listeners.delete(id);
      };
    }
  };
};
