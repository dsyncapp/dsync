export enum PlayerEventType {
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

export type NavigateEvent = PlayerEvent & {
  type: PlayerEventType.Navigate;
  url: string;
};

export type VideoEventHandler = (event: PlayerEvent | NavigateEvent) => void;

export type VideoManager = {
  pause: () => void;
  resume: () => void;
  seek: (time: number) => void;

  getState: () => Promise<PlayerStatus>;
};
