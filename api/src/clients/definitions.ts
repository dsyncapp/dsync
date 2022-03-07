import * as protocols from "@dsyncapp/protocols";

export type CreateClientParams = {
  room_id: string;
  peer_id: string;
};

export type ClientEventHandler = (event: protocols.p2p.PeerEvent) => void;

export type Client = {
  send: (event: protocols.p2p.PeerEvent) => Promise<void>;
  subscribe: (handler: ClientEventHandler) => () => void;
  disconnect: () => void;
};
