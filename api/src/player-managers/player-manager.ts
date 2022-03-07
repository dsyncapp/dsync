import * as protocols from "@dsyncapp/protocols";

export type NavigateEvent = {
  type: "navigate";
  url: string;
};

export type PlayerEvent = protocols.ipc.PlayerEvent | NavigateEvent;
export type PlayerEventHandler = (event: PlayerEvent) => void;

export type PlayerManager = {
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  getState: () => Promise<protocols.ipc.PlayerState>;
  subscribe: (handler: PlayerEventHandler) => () => void;
};
