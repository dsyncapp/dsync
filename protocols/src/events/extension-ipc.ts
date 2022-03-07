import * as ipc from "./ipc-events";
import * as codecs from "../codecs";

type TabReference = {
  reference_id: string;
};

export type TabUpserted = {
  type: "upsert-tab";
  url: string;
};

export type TabClosed = {
  type: "tab-closed";
};

export type CloseTab = {
  type: "close-tab";
};

export type Event = TabReference & (ipc.IPCEvent | TabUpserted | TabClosed | CloseTab);

export const Codec = codecs.createBSONCodec((data: Event) => true);
