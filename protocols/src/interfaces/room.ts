import * as signaling from "../events/signaling-events";
import * as p2p from "../events/p2p-events";

export type Peer = {
  id: string;
};

export type RoomEventHandler = (event: p2p.PeerEvent) => void;

export type Room = {
  id: string;
  peer_id: string;
  peers: () => Peer[];
  subscribe: (handler: RoomEventHandler) => () => void;
  destroy: () => void;
};

export type SignalingControllerEventHandler = (event: signaling.SignalingEvent) => void;

export type JoinRoomParams = {
  room_id: string;
  peer_id: string;
};

export type SignalingController = {
  send: (event: signaling.SignalingEvent) => void;
  joinRoom: (params: JoinRoomParams) => () => void;
  subscribe: (handler: SignalingControllerEventHandler) => () => void;
};
