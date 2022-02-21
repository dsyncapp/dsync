import * as protocols from "@dsyncapp/protocols";

export type NavigateEvent = {
  type: "navigate";
  url: string;
};

export type VideoEventHandler = (event: protocols.ipc.PlayerEvent | NavigateEvent) => void;

export type VideoManager = {
  pause: () => void;
  resume: () => void;
  seek: (time: number) => void;
  getState: () => Promise<protocols.ipc.PlayerState>;
};
