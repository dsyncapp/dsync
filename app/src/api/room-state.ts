import * as managers from "../video-managers";
import * as constants from "../constants";
import * as y from "yjs";

type SourceState = {
  playing: boolean;
  position?: number;
};

type RoomMetadata = {
  name: string;
  source: string;
};

export type Peer = {
  client_id: string;
  process_id: string;

  heartbeat: string;

  status: managers.PlayerStatus;
};

export type SerializedRoomState = {
  metadata: RoomMetadata;
  sources: Record<string, SourceState>;
  peers: Record<string, Peer>;
};

const serializeRoomState = (doc: y.Doc): SerializedRoomState => {
  const metadata = doc.getMap<any>("metadata");
  const sources = doc.getMap("sources");
  const peers = doc.getMap("peers");

  const serialized_sources: Record<string, SourceState> = {};
  for (const [key, source] of sources.entries()) {
    serialized_sources[key] = {
      playing: source.get("playing") || false,
      position: source.get("position")
    };
  }

  return {
    metadata: {
      name: metadata.get("name") || "",
      source: metadata.get("source") || ""
    },
    sources: serialized_sources,
    peers: peers.toJSON()
  };
};

const setIfDifferent = (map: y.Map<any>, key: string, value: any) => {
  if (map.get(key) !== value) {
    map.set(key, value);
  }
};

export class RoomState {
  constructor(private document: y.Doc) {}

  private update = (updater: (doc: y.Doc) => void) => {
    this.document.transact(() => {
      updater(this.document);
    }, constants.process_id);
  };

  private set = (key: string, value: any) => {
    this.update((doc) => {
      const source = doc.getMap("metadata").get("source") as string;
      let map = doc.getMap("sources").get(source) as y.Map<any> | undefined;
      if (!map) {
        map = new y.Map();
        doc.getMap("sources").set(source, map);
      }

      setIfDifferent(map, key, value);
    });
  };

  setSource = (source: string) => {
    this.update((doc) => {
      const metadata = doc.getMap("metadata");
      if (metadata.get("source") !== source) {
        metadata.set("source", source);
      }
    });
  };

  setName = (name: string) => {
    this.update((doc) => {
      const metadata = doc.getMap("metadata");
      if (metadata.get("name") !== name) {
        metadata.set("name", name);
      }
    });
  };

  resume = () => {
    this.set("playing", true);
  };

  pause = () => {
    this.set("playing", false);
  };

  seek = (time: number) => {
    this.set("position", time);
  };

  updateStatus = (status: managers.PlayerStatus) => {
    this.update((doc) => {
      const peers = doc.getMap<y.Map<any>>("peers");

      let map = peers.get(constants.process_id);
      if (!map) {
        map = new y.Map();
        peers.set(constants.process_id, map);
      }

      setIfDifferent(map, "client_id", constants.client_id);
      setIfDifferent(map, "process_id", constants.process_id);
      setIfDifferent(map, "heartbeat", new Date().toISOString());
      setIfDifferent(map, "status", status);
    });
  };

  observe = (observer: (patch: Uint8Array, origin: string) => void) => {
    this.document.on("update", observer);
    return () => {
      this.document.off("update", observer);
    };
  };

  serialize = () => {
    return Buffer.from(y.encodeStateAsUpdate(this.document)).toString("base64");
  };

  createPatch = () => {
    return {
      vector: Buffer.from(y.encodeStateVector(this.document)).toString("base64"),
      patch: Buffer.from(y.encodeStateAsUpdate(this.document)).toString("base64")
    };
  };

  applyPatch = (patch: string) => {
    y.applyUpdate(this.document, Buffer.from(patch, "base64"));
  };

  static deserialize = (data: string) => {
    const doc = new y.Doc();
    y.applyUpdate(doc, Buffer.from(data, "base64"));

    return new RoomState(doc);
  };

  toJSON = () => {
    return serializeRoomState(this.document);
  };
}
