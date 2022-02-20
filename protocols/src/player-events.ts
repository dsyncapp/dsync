export enum PlayerEventType {
  Play = "play",
  Pause = "pause",

  Playing = "playing",
  Waiting = "waiting",

  Seeking = "seeking",
  Seeked = "seeked"
}

export type PlayerStatus = {
  paused: boolean;
  seeking: boolean;
  time: number;
};

export type PlayerEvent = {
  type: PlayerEventType;
  status: PlayerStatus;
};
