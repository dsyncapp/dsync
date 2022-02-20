import * as player_events from "./player-events";

export enum IPCEventType {
  PlayerLoaded = "player-loaded",
  PlayerEvent = "player-event",

  GetStatus = "get-status",
  StatusResponse = "status-response",

  Pause = "pause",
  Play = "play",
  Seek = "seek"
}

export type PlayerLoadedEvent = {
  type: IPCEventType.PlayerLoaded;
  frame_id: string;
};

export type EmittedPlayerEvent = {
  type: IPCEventType.PlayerEvent;
  event: player_events.PlayerEventType;
  status: player_events.PlayerStatus;
};

export type StatusCommand = {
  type: IPCEventType.Pause | IPCEventType.Play | IPCEventType.GetStatus;
};

export type StatusResponseEvent = {
  type: IPCEventType.StatusResponse;
  status: player_events.PlayerStatus;
};

export type SeekCommand = {
  type: IPCEventType.Seek;
  time: number;
};

export type IPCEvent = PlayerLoadedEvent | EmittedPlayerEvent | StatusCommand | SeekCommand | StatusResponseEvent;

export const IPCCodec = {
  encode: (data: IPCEvent) => JSON.stringify(data),
  decode: (data: Buffer | string) => JSON.parse(data.toString()) as IPCEvent
};
