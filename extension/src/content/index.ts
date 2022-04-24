import "../polyfill";

import * as protocols from "@dsyncapp/protocols";
import * as controllers from "./controllers";
import * as socket from "../socket";
import * as uuid from "uuid";

type Player = {
  id: string;
  controller: controllers.PlayerController;
  event_lock: Set<string>;
};

const players = new Map<string, Player>();

const emit = (event: protocols.ipc.IPCEvent) => {
  const player = players.get(event.player_id);
  if (!player) {
    return;
  }

  chrome.runtime.sendMessage(event);
};

const listenForCommands = (player: Player) => {
  chrome.runtime.onMessage.addListener((message: protocols.ipc.IPCEvent) => {
    console.log("message", message);
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
        return emit({
          type: "player-state",
          player_id: player.id,
          state: player.controller.state
        });
      }
    }
  });
};

const onPlayerLoaded = (controller: controllers.PlayerController) => {
  const id = `player-${uuid.v4()}`;

  console.log(`Player found. Assigning id ${id}`);

  const player: Player = {
    id,
    controller,
    event_lock: new Set()
  };

  players.set(id, player);

  listenForCommands(player);

  controller.subscribe((event) => {
    if (player.event_lock.has(event.type)) {
      return player.event_lock.delete(event.type);
    }
    emit({
      type: "player-event",
      player_id: player.id,
      payload: event
    });
  });
};

const scanDocumentForPlayers = () => {
  const video = document.querySelector("video");
  if (!video) {
    return;
  }

  const existing = Array.from(players.values()).find((player) => {
    return player.controller.video === video;
  });
  if (existing) {
    return;
  }

  console.log(video, video.id);
  onPlayerLoaded(controllers.create(video));
};

let known_frames = new Set<HTMLIFrameElement>();
const scanDocumentForIFrames = () => {
  const frames = document.getElementsByTagName("iframe");

  let found_new_frames = false;
  for (const frame of frames) {
    if (known_frames.has(frame)) {
      continue;
    }

    known_frames.add(frame);
    found_new_frames = true;

    new MutationObserver(() => {
      socket.sendMessage(socket.FromProcess.ContentScript, {
        type: "new-iframe"
      });
    }).observe(frame, {
      attributes: true
    });
  }

  if (found_new_frames) {
    socket.sendMessage(socket.FromProcess.ContentScript, {
      type: "new-iframe"
    });
  }
};

const meta = document.getElementById("__dsyncapp_lock");
if (!meta) {
  const meta = document.createElement("meta");
  meta.id = "__dsyncapp_lock";
  document.querySelector("head").append(meta);

  console.log("Desync extension content script loaded. Setting up monitors for video players");

  new MutationObserver(() => {
    scanDocumentForPlayers();
    scanDocumentForIFrames();
  }).observe(document, {
    childList: true,
    subtree: true
  });

  scanDocumentForPlayers();

  setInterval(() => {
    chrome.runtime.sendMessage({
      from: "keepalive"
    });
  }, 500);
}
