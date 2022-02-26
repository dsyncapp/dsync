import * as protocols from "@dsyncapp/protocols";

export type PlayerController = {
  state: protocols.ipc.PlayerState;

  play: () => void;
  pause: () => void;
  seek: (time: number) => void;

  subscribe: (handler: (event: protocols.ipc.PlayerEvent) => void) => void;
};
