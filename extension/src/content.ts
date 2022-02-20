import * as browser from "webextension-polyfill";

console.log("Extension content script loaded successfully");

const lock = new Set();
let player: HTMLVideoElement | undefined;
let port: browser.Runtime.Port | undefined;

const emit = (event: any) => {
  port?.postMessage(event);
};

const getPlayerStatus = (player: HTMLVideoElement) => {
  return {
    paused: player.paused,
    seeking: player.seeking,
    time: player.currentTime,
    duration: player.duration
  };
};

const listenForCommands = (player: HTMLVideoElement, port: browser.Runtime.Port) => {
  port.onMessage.addListener((message) => {
    switch (message.type) {
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
        player.currentTime = message.time;
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
};

const onPlayerLoaded = (new_player: HTMLVideoElement) => {
  console.log("Player found", new_player);

  new_player.autoplay = false;

  player = new_player;
  port = browser.runtime.connect();

  listenForCommands(player, port);

  emit({
    type: "player-loaded",
    frame_id: 1
  });

  const events = ["waiting", "play", "pause", "playing", "seeking", "seek"];
  events.map((event) => {
    new_player.addEventListener(event, () => {
      // if (lock.has(event)) {
      //   return lock.delete(event);
      // }
      emit({
        type: "player-event",
        payload: {
          type: event,
          status: getPlayerStatus(new_player)
        }
      });
    });
  });

  new_player.addEventListener("loadstart", () => {
    emit({
      type: "player-event",
      payload: {
        type: "ready",
        status: getPlayerStatus(new_player)
      }
    });
  });
};

const interval = setInterval(() => {
  const players = document.getElementsByTagName("video");
  if (players.length > 0) {
    clearInterval(interval);
    onPlayerLoaded(players[0]);
  }
}, 200);
