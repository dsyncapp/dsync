import * as codecs from "../codecs";

export enum PlayerEventType {
  Play = "play",
  Pause = "pause",

  Playing = "playing",
  Waiting = "waiting",

  Seeking = "seeking",
  Seeked = "seeked"
}

export type PlayerState = {
  paused: boolean;
  seeking: boolean;
  time: number;
};

export type PlayerEvent = {
  type: PlayerEventType;
  state: PlayerState;
};

export type PlayerRegistered = {
  type: "player-registered";
  player_id: string;
};

export type PlayerDeregistered = {
  type: "player-deregistered";
  player_id: string;
};

export type IPCPlayerEvent = {
  type: "player-event";
  player_id: string;
  payload: PlayerEvent;
};

export type PlayerCommand = {
  type: "pause" | "play" | "get-state";
  player_id: string;
};

export type SeekCommand = {
  type: "seek";
  player_id: string;
  time: number;
};

export type PlayerStateEvent = {
  type: "player-state";
  player_id: string;
  state: PlayerState;
};

export type IPCEvent =
  | PlayerRegistered
  | PlayerDeregistered
  | IPCPlayerEvent
  | PlayerCommand
  | SeekCommand
  | PlayerStateEvent;

export const IPCCodec = codecs.createBSONCodec((data: IPCEvent) => true);
