import * as protocols from "@dsyncapp/protocols";
import * as _ from "lodash";
import * as y from "yjs";

type PlayerState = {
  paused: boolean;
  time: number;
  updated_at: number;
};

type RoomMetadata = {
  name?: string;
  source?: string;
};

export type Peer = {
  id: string;
  status: protocols.ipc.PlayerState;
  updated_at: number;
};

export type RoomState = {
  metadata: RoomMetadata;
  state: PlayerState;
  peers: Record<string, Peer>;
};

const serializeRoomState = (doc: y.Doc): RoomState => {
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
  current: RoomState;
  previous: RoomState;
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

  getState: () => RoomState;
  observe: (observer: RoomObserver) => () => void;

  applyUpdate: (update: Buffer) => void;
  encode: (vector?: Buffer | Uint8Array) => Buffer;
  getVector: () => Buffer;

  updatePeerStatus: (peer_id: string, status: protocols.ipc.PlayerState) => void;

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

  return {
    id: params.id,
    state: doc,
    get synced() {
      return synced;
    },

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
      synced = true;
      y.applyUpdate(doc, patch);
    },
    encode: (vector) => {
      return Buffer.from(y.encodeStateAsUpdate(doc, vector));
    },
    getVector: () => {
      return Buffer.from(y.encodeStateVector(doc));
    },

    updatePeerStatus: (peer_id, state) => {
      doc.transact(() => {
        const peers = doc.getMap<y.Map<any>>("peers");

        let peer = peers.get(peer_id);
        if (!peer) {
          peer = new y.Map();
          peers.set(peer_id, peer);
        }

        setIfDifferent(peer, "id", peer_id);
        setIfDifferent(peer, "status", state);
        setIfDifferent(peer, "updated_at", Date.now());
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
  };
};