import * as player_events from "./player-events";

export type SetSource = {
  type: "set-source";
  source: string;
};

export type PlayerEvent = {
  type: "player-event";
  payload: player_events.PlayerEvent;
};

export type StatusCommand = {
  type: "pause" | "play" | "get-status";
};

export type StatusResponseEvent = {
  type: "current-status";
  status: player_events.PlayerStatus;
};

export type SeekCommand = {
  type: "seek";
  time: number;
};

export type ExtensionIPCEvent = SetSource | StatusCommand | SeekCommand | StatusResponseEvent | PlayerEvent;

export const ExtensionIPCCodec = {
  encode: (data: ExtensionIPCEvent) => JSON.stringify(data),
  decode: (data: Buffer | string) => JSON.parse(data.toString()) as ExtensionIPCEvent
};
