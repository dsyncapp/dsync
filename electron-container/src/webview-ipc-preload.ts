import * as electron from "electron";

console.log("custom preload script was loaded successfully");

const emit = (event: any) => {
  electron.ipcRenderer.sendToHost("dsync", event);
};

const lock = new Set();
let player: HTMLVideoElement | undefined;

const getPlayerStatus = (player: HTMLVideoElement) => {
  return {
    paused: player.paused,
    seeking: player.seeking,
    time: player.currentTime,
    duration: player.duration
  };
};

electron.ipcRenderer.on("dsync", (_e, event) => {
  if (!player) {
    return;
  }

  switch (event.type) {
    case "pause": {
      if (player.paused) {
        return;
      }
      lock.add("pause");
      return player.pause();
    }
    case "play": {
      if (!player.paused) {
        return;
      }
      lock.add("play");
      return player.play();
    }
    case "seek": {
      lock.add("seeking");
      player.currentTime = event.time;
      return;
    }
    case "get-status": {
      return emit({
        type: "status-response",
        status: getPlayerStatus(player)
      });
    }
  }
});

const onPlayerLoaded = (new_player: HTMLVideoElement) => {
  console.log("Player found", new_player);

  player = new_player;
  emit({
    type: "player-loaded",
    frame_id: electron.webFrame.routingId,
    player_details: {
      id: player.getAttribute("id"),
      name: player.getAttribute("name"),
      class_name: player.getAttribute("className")
    }
  });

  const events = ["waiting", "play", "pause", "playing", "seeking", "seek"];
  events.map((event) => {
    new_player.addEventListener(event, () => {
      if (lock.has(event)) {
        return lock.delete(event);
      }
      emit({
        type: "player-event",
        event: event,
        status: getPlayerStatus(new_player)
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