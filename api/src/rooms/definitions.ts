import * as protocols from "@dsyncapp/protocols";

export type PlayerState = {
  paused: boolean;
  time: number;
  updated_at: number;
};

export type RoomMetadata = {
  name?: string;
  source?: string;
};

export type Peer = {
  id: string;
  status: protocols.ipc.PlayerState;
  updated_at: number;
};

export type RoomState = {
  metadata: RoomMetadata;
  state: PlayerState;
  peers: Record<string, Peer>;
};
