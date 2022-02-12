console.log("custom preload script was loaded successfully");

const electron = require("electron");

const emit = (event) => {
  electron.ipcRenderer.sendToHost("dsync", event);
};

let player;

electron.ipcRenderer.on("dsync", (_e, event) => {
  if (!player) {
    return;
  }

  switch (event.type) {
    case "pause": {
      if (player.paused) {
        return;
      }
      return player.pause();
    }
    case "resume": {
      if (!player.paused) {
        return;
      }
      return player.play();
    }
    case "seek": {
      player.currentTime = event.time;
      return;
    }
  }
});

const onPlayerLoaded = (new_player) => {
  player = new_player;
  emit({
    type: "player-loaded",
    frame_id: electron.webFrame.routingId
  });

  player.addEventListener("pause", () => {
    emit({
      type: "pause"
    });
  });

  player.addEventListener("play", () => {
    emit({
      type: "resume"
    });
  });

  player.addEventListener("seeking", () => {
    emit({
      type: "seek",
      time: player.currentTime
    });
  });
};

window.addEventListener("DOMContentLoaded", (event) => {
  console.log("DOM fully loaded and parsed");

  const interval = setInterval(() => {
    const players = document.getElementsByTagName("video");
    if (players.length > 0) {
      clearInterval(interval);
      onPlayerLoaded(players[0]);
    }
  }, 200);
});
