import * as protocols from "@dsyncapp/protocols";
import * as electron from "electron";

console.log("custom preload script was loaded successfully");

const emit = (event: protocols.ipc.IPCEvent) => {
  electron.ipcRenderer.sendToHost("dsync", event);
};

const player_id = String(electron.webFrame.routingId);
const lock = new Set<protocols.ipc.PlayerEventType>();
let player: HTMLVideoElement | undefined;

const getPlayerState = (player: HTMLVideoElement): protocols.ipc.PlayerState => {
  return {
    paused: player.paused,
    seeking: player.seeking,
    time: player.currentTime
    // duration: player.duration
  };
};

electron.ipcRenderer.on("dsync", (_e, event: protocols.ipc.IPCEvent) => {
  if (!player) {
    return;
  }

  switch (event.type) {
    case "pause": {
      if (player.paused) {
        return;
      }
      lock.add(protocols.ipc.PlayerEventType.Pause);
      return player.pause();
    }
    case "play": {
      if (!player.paused) {
        return;
      }
      lock.add(protocols.ipc.PlayerEventType.Play);
      return player.play();
    }
    case "seek": {
      lock.add(protocols.ipc.PlayerEventType.Seeking);
      player.currentTime = event.time;
      return;
    }
    case "get-state": {
      return emit({
        type: "player-state",
        player_id,
        state: getPlayerState(player)
      });
    }
  }
});

const onPlayerLoaded = (new_player: HTMLVideoElement) => {
  console.log("Player found", new_player);

  player = new_player;
  emit({
    type: "player-registered",
    player_id
  });

  Object.values(protocols.ipc.PlayerEventType).map((event) => {
    new_player.addEventListener(event, () => {
      if (lock.has(event)) {
        return lock.delete(event);
      }
      emit({
        type: "player-event",
        player_id,
        payload: {
          type: event,
          state: getPlayerState(new_player)
        }
      });
    });
  });
};

window.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded and parsed");

  const interval = setInterval(() => {
    const players = document.getElementsByTagName("video");
    if (players.length > 0) {
      clearInterval(interval);
      onPlayerLoaded(players[0]);
    }
  }, 200);
});
