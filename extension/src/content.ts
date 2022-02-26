import * as protocols from "@dsyncapp/protocols";
import * as browser from "webextension-polyfill";
import * as controllers from "./controllers";
import * as uuid from "uuid";

type Player = {
  id: string;
  controller: controllers.PlayerController;
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

const listenForCommands = (player: Player) => {
  player.port.onMessage.addListener((message: protocols.ipc.IPCEvent) => {
    switch (message.type) {
      case "pause": {
        if (player.controller.state.paused) {
          return;
        }
        console.log("Pausing");

        player.event_lock.add("pause");
        return player.controller.pause();
      }
      case "play": {
        if (!player.controller.state.paused) {
          return;
        }
        console.log("Playing");

        player.event_lock.add("play");
        return player.controller.play();
      }
      case "seek": {
        console.log("Seeking", message.time);

        player.event_lock.add("seeking");
        player.controller.seek(message.time);
        return;
      }
      case "get-state": {
        return emit(player.id, {
          type: "player-state",
          player_id: player.id,
          state: player.controller.state
        });
      }
    }
  });
};

const onPlayerLoaded = (controller: controllers.PlayerController) => {
  const id = uuid.v4();

  console.log(`Player found. Assigning id ${id}`);

  const port = browser.runtime.connect({
    name: id
  });

  const player: Player = {
    id,
    controller,
    event_lock: new Set(),
    port
  };

  players.set(id, player);

  listenForCommands(player);

  controller.subscribe((event) => {
    if (player.event_lock.has(event.type)) {
      return player.event_lock.delete(event.type);
    }
    emit(player.id, {
      type: "player-event",
      player_id: player.id,
      payload: event
    });
  });
};

// @ts-ignore
if (!window.__dsyncapp_lock) {
  // @ts-ignore
  window.__dsyncapp_lock = true;

  console.log("Extension content script loaded successfully");

  const interval = setInterval(() => {
    const player = controllers.scanForPlayer();
    if (!player) {
      return;
    }

    clearInterval(interval);
    onPlayerLoaded(player);
  }, 500);
}
