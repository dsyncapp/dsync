import * as protocols from "@dsyncapp/protocols";
import * as browser from "webextension-polyfill";
import * as uuid from "uuid";

console.log("Extension content script loaded successfully");

type Player = {
  id: string;
  node: HTMLVideoElement;
  port: browser.Runtime.Port;
  event_lock: Set<string>;
};

const players = new Map<string, Player>();

const emit = (id: string, event: protocols.ipc.IPCEvent) => {
  const player = players.get(id);
  if (!player) {
    return;
  }

  player.port.postMessage(event);
};

const getPlayerState = (id: string): protocols.ipc.PlayerState => {
  const player = players.get(id);
  if (!player) {
    return {
      paused: true,
      seeking: false,
      time: -1
    };
  }
  return {
    paused: player.node.paused,
    seeking: player.node.seeking,
    time: player.node.currentTime
    // duration: player.node.duration
  };
};

const listenForCommands = (player: Player) => {
  player.port.onMessage.addListener((message: protocols.ipc.IPCEvent) => {
    switch (message.type) {
      case "pause": {
        if (player.node.paused) {
          return;
        }
        player.event_lock.add("pause");
        return player.node.pause();
      }
      case "play": {
        if (!player.node.paused) {
          return;
        }
        player.event_lock.add("play");
        return player.node.play();
      }
      case "seek": {
        player.event_lock.add("seeking");
        player.node.currentTime = message.time;
        return;
      }
      case "get-state": {
        return emit(player.id, {
          type: "player-state",
          player_id: player.id,
          state: getPlayerState(player.id)
        });
      }
    }
  });
};

const onPlayerLoaded = (video: HTMLVideoElement) => {
  const id = uuid.v4();

  const port = browser.runtime.connect({
    name: id
  });

  const player: Player = {
    id,
    node: video,
    event_lock: new Set(),
    port
  };

  players.set(id, player);

  listenForCommands(player);

  Object.values(protocols.ipc.PlayerEventType).map((event) => {
    video.addEventListener(event, () => {
      if (player.event_lock.has(event)) {
        return player.event_lock.delete(event);
      }
      emit(player.id, {
        type: "player-event",
        player_id: player.id,
        payload: {
          type: event,
          state: getPlayerState(player.id)
        }
      });
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
