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

  /**
   * This is the time the current play 'period' was initialized from. Typically this
   * should match the room state `time` property.
   *
   * This is used to control 'seeking' and ensures all players start playing at the same time
   */
  start_time: number;

  updated_at: number;
};

export type RoomState = {
  metadata: RoomMetadata;
  state: PlayerState;
  peers: Record<string, Peer>;
};
