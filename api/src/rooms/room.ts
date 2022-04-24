import * as protocols from "@dsyncapp/protocols";
import * as defs from "./definitions";
import * as date from "date-fns";
import * as mobx from "mobx";
import * as _ from "lodash";
import * as y from "yjs";

const serializeRoomState = (doc: y.Doc): defs.RoomState => {
  const metadata = doc.getMap<any>("metadata");
  const state = doc.getMap<any>("state");
  const peers = doc.getMap("peers");

  return {
    metadata: metadata.toJSON() || {},
    state: _.merge(
      {
        paused: true,
        time: -1,
        updated_at: -1
      },
      state.toJSON()
    ),
    peers: peers.toJSON()
  };
};

const setIfDifferent = (map: y.Map<any>, key: string, value: any) => {
  if (map.get(key) !== value) {
    map.set(key, value);
  }
};

export type RoomStateChangeEvent = {
  current: defs.RoomState;
  previous: defs.RoomState;
  patch: Uint8Array;
  origin: string;
};
export type RoomObserver = (event: RoomStateChangeEvent) => void;

export type Room = {
  id: string;
  state: y.Doc;

  /**
   * This indicates whether or not the room has received some 'seed' state from another
   * already synced peer. This is only relevant for peers who are joining a room for
   * the first time.
   *
   * Any peers already in a room or the peer who initially created the room will already
   * be synced.
   */
  synced: boolean;

  getState: () => defs.RoomState;
  observe: (observer: RoomObserver) => () => void;

  applyUpdate: (update: Buffer) => void;
  encode: (vector?: Buffer | Uint8Array) => Buffer;
  getVector: () => Buffer;

  updatePeerStatus: (peer_id: string, status: protocols.ipc.PlayerState, time?: number) => void;

  setName: (name: string, origin: string) => void;
  setSource: (source: string, origin: string) => void;

  pause: (origin: string) => void;
  play: (origin: string) => void;
  seek: (time: number, origin: string) => void;
};

type CreateRoomParams = {
  id: string;
  state?: Buffer | y.Doc;
};
export const createRoom = (params: CreateRoomParams): Room => {
  let doc = new y.Doc();
  let synced = false;

  if (params.state) {
    if (params.state instanceof y.Doc) {
      doc = params.state;
    } else {
      y.applyUpdate(doc, params.state);
    }
    synced = true;
  }

  const setPlayerState = (key: string, value: any, origin: string) => {
    doc.transact(() => {
      const state = doc.getMap("state");
      setIfDifferent(state, key, value);
      setIfDifferent(state, "updated_at", Date.now());
    }, origin);
  };

  const room: Room = mobx.observable({
    id: params.id,
    state: doc,
    synced,

    getState: () => {
      return serializeRoomState(doc);
    },
    observe: (observer) => {
      let previous = serializeRoomState(doc);
      const handler = (patch: Uint8Array, origin: string) => {
        const current = serializeRoomState(doc);
        observer({
          previous,
          current,
          origin,
          patch
        });
        previous = current;
      };

      doc.on("update", handler);
      return () => {
        doc.off("update", handler);
      };
    },

    applyUpdate: (patch: Buffer) => {
      room.synced = true;
      y.applyUpdate(doc, patch);
    },
    encode: (vector) => {
      return Buffer.from(y.encodeStateAsUpdate(doc, vector));
    },
    getVector: () => {
      return Buffer.from(y.encodeStateVector(doc));
    },

    updatePeerStatus: (peer_id, state, time) => {
      doc.transact(() => {
        const peers = doc.getMap<y.Map<any>>("peers");

        let peer = peers.get(peer_id);
        if (!peer) {
          peer = new y.Map();
          peers.set(peer_id, peer);
        }

        setIfDifferent(peer, "id", peer_id);
        setIfDifferent(peer, "status", state);
        setIfDifferent(peer, "start_time", time || peer.get("start_time") || 0);
        setIfDifferent(peer, "updated_at", Date.now());

        // Garbage collect old peers
        peers.forEach((peer, id) => {
          const updated_at = peer.get("updated_at");
          if (!updated_at || Math.abs(date.differenceInSeconds(new Date(updated_at), new Date())) > 5) {
            console.log("GCING peer");
            peers.delete(id);
          }
        });
      }, peer_id);
    },

    setName: (name, origin) => {
      doc.transact(() => {
        const metadata = doc.getMap("metadata");
        if (metadata.get("name") !== name) {
          metadata.set("name", name);
        }
      }, origin);
    },
    setSource: (source, origin) => {
      doc.transact(() => {
        const metadata = doc.getMap("metadata");
        if (metadata.get("source") !== source) {
          metadata.set("source", source);
        }
      }, origin);
    },

    play: (origin) => {
      setPlayerState("paused", false, origin);
    },
    pause: (origin) => {
      setPlayerState("paused", true, origin);
    },
    seek: (time: number) => {
      setPlayerState("time", time, origin);
    }
  });

  return room;
};
