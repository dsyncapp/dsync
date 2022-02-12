import * as y from "yjs";

type SourceState = {
  playing: boolean;
  position?: number;
};

type Observer = (current: SourceState, previous: SourceState, changed: Array<keyof SourceState>) => void;

const sourceStateFromMap = (map: y.Map<any>): SourceState => {
  return {
    playing: map.get("playing") || false,
    position: map.get("position")
  };
};

export class RoomState {
  constructor(private document: y.Doc, private socket_id: string) {}

  private set = (source: string, key: string, value: any) => {
    this.document.transact(() => {
      this.document.getMap(source).set(key, value);
    }, this.socket_id);
  };

  resume = (source: string) => {
    this.set(source, "playing", true);
  };

  pause = (source: string) => {
    this.set(source, "playing", false);
  };

  seek = (source: string, time: number) => {
    this.set(source, "position", time);
  };

  observe = (source: string, observer: Observer) => {
    const state = this.document.getMap(source);

    let previous = sourceStateFromMap(state);

    const handler = (event: y.YMapEvent<unknown>) => {
      if (event.transaction.origin === this.socket_id) {
        return;
      }

      const next = sourceStateFromMap(event.target as any);
      observer(next, previous, Array.from(event.keysChanged));
      previous = next;
    };

    state.observe(handler);

    return () => {
      state.unobserve(handler);
    };
  };

  read = (source: string) => {
    return sourceStateFromMap(this.document.getMap(source));
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

  static deserialize = (data: string, socket_id: string) => {
    const doc = new y.Doc();
    y.applyUpdate(doc, Buffer.from(data, "base64"));

    return new RoomState(doc, socket_id);
  };
}
