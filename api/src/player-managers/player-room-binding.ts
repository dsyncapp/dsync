import * as player_manager from "./player-manager";
import * as protocols from "@dsyncapp/protocols";
import * as rooms from "../rooms";

export type BindPlayerToRoomParams = {
  manager: player_manager.PlayerManager;
  room: rooms.Room;
  peer_id: string;
};

export const bindPlayerToRoom = (params: BindPlayerToRoomParams) => {
  console.log(`Binding player to room ${params.room.id}`);

  const observer = params.room.observe((event) => {
    const state = event.current.state;
    const previous_state = event.previous.state;

    if (state.paused !== previous_state.paused) {
      if (state.paused) {
        params.manager.pause();
      } else {
        params.manager.play();
      }
      return;
    }

    const us = event.current.peers[params.peer_id];
    if (!us) {
      return;
    }

    if (Math.round(us.start_time) !== Math.round(state.time)) {
      return params.manager.seek(state.time);
    }

    if (
      rooms.utils.allPeersReady(event.current.state, event.current.peers) &&
      !rooms.utils.allPeersReady(event.previous.state, event.previous.peers)
    ) {
      if (!state.paused) {
        console.log("Resuming as all peers have become ready");
        params.manager.play();
        return;
      }
    }

    if (
      !rooms.utils.allPeersReady(event.current.state, event.current.peers) &&
      rooms.utils.allPeersReady(event.previous.state, event.previous.peers)
    ) {
      console.log("Pausing as all peers are no longer ready");
      params.manager.pause();
      return;
    }

    if (!state.paused && us.status.paused && rooms.utils.allPeersReady(event.current.state, event.current.peers)) {
      return params.manager.play();
    }

    if (state.paused && !us.status.paused) {
      return params.manager.pause();
    }

    if (state.paused) {
      return;
    }

    const delta = rooms.utils.getDeltaFromFurthestPeer(event.current.peers, us);
    if (!delta) {
      return;
    }

    const last_update = state.updated_at || 0;
    if (delta.peer.updated_at < last_update || us.updated_at < last_update) {
      return;
    }

    if (rooms.utils.peerIsReady(state, delta.peer) && rooms.utils.peerIsReady(state, us) && delta.diff > 1) {
      console.log("More than 1s out of sync with furthest peer. Adjusting time");

      // We adjust in steps to prevent over correcting small deltas
      params.manager.getState().then((status) => {
        params.manager.seek(status.time - delta.diff / 2);
      });

      return;
    }
  });

  const interval = setInterval(() => {
    params.manager.getState().then((status) => {
      params.room.updatePeerStatus(params.peer_id, status);

      const room_state = params.room.getState();
      if (!status.paused && !rooms.utils.allPeersReady(room_state.state, room_state.peers)) {
        params.manager.pause();
      }
    });
  }, 500);

  const manager_subscription = params.manager.subscribe((event) => {
    switch (event.type) {
      case "navigate": {
        if (!event.url) {
          return;
        }
        console.log(`Navigating to ${event.url}`);
        return params.room.setSource(event.url, params.peer_id);
      }

      case protocols.ipc.PlayerEventType.Play: {
        console.log("video resumed");
        return params.room.play(params.peer_id);
      }
      case protocols.ipc.PlayerEventType.Pause: {
        console.log("video paused");
        return params.room.pause(params.peer_id);
      }
      case protocols.ipc.PlayerEventType.Seeking: {
        console.log("seeking to new position", event.state.time);
        return params.room.seek(event.state.time, params.peer_id);
      }
      case protocols.ipc.PlayerEventType.Seeked: {
        console.log("seeked to new position", event.state.time);
        return params.room.updatePeerStatus(params.peer_id, event.state, event.state.time);
      }
    }
  });

  return () => {
    observer();
    clearInterval(interval);
    manager_subscription();
  };
};
