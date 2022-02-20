export enum PlayerEventType {
  Ready = "ready",

  Play = "play",
  Pause = "pause",

  Playing = "playing",
  Waiting = "waiting",

  Seeking = "seeking",
  Seeked = "seeked",

  Navigate = "navigate"
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

export type NavigateEvent = {
  type: PlayerEventType.Navigate;
  status: PlayerStatus;
  url: string;
};

export type ReadyEvent = {
  type: PlayerEventType.Navigate;
  status: PlayerStatus;
};

export type VideoEventHandler = (event: PlayerEvent | NavigateEvent | ReadyEvent) => void;

export type VideoManager = {
  pause: () => void;
  resume: () => void;
  seek: (time: number) => void;

  getState: () => Promise<PlayerStatus>;
};
