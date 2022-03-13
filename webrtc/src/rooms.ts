import * as protocols from "@dsyncapp/protocols";
import * as peers from "./peers";
import * as uuid from "uuid";

export type CreateWebRTCRoomParams = {
  peer_id: string;
  room_id: string;
  signaling_controller: protocols.p2p.SignalingController;
};

export const createWebRTCRoom = (params: CreateWebRTCRoomParams): protocols.p2p.Room => {
  const known = new Set<string>();

  const unsubscribe = params.signaling_controller.subscribe((event) => {
    switch (event.type) {
      case protocols.p2p.SignalingEventType.Connect: {
        console.log("connect event");
        if (known.has(event.sender_peer_id)) {
          return;
        }
        known.add(event.sender_peer_id);

        // TODO: Check for active connection with peer
        console.log(`Peer ${event.sender_peer_id} is attempting to establish WebRTC connection.`);

        const peer = peers.createPeer({
          id: params.peer_id,
          connection_id: event.connection_id,
          peer_id: event.sender_peer_id,
          master: false,
          signaling_controller: params.signaling_controller
        });
        return;
      }

      /**
       * When a peer announces itself to a room, all other peers in the room should attempt to
       * connect to the new peer.
       */
      case protocols.p2p.SignalingEventType.Announce: {
        if (known.has(event.sender_peer_id)) {
          return;
        }
        known.add(event.sender_peer_id);

        // TODO: Check for active connection with peer
        console.log(`Peer ${event.sender_peer_id} is announcing itself. Attempting to establish WebRTC connection`);

        const connection_id = uuid.v4();

        params.signaling_controller.send({
          type: protocols.p2p.SignalingEventType.Connect,
          connection_id: connection_id,
          peer_id: event.sender_peer_id,
          room_id: params.room_id,
          sender_peer_id: params.peer_id
        });

        const peer = peers.createPeer({
          id: params.peer_id,
          connection_id: connection_id,
          peer_id: event.sender_peer_id,
          master: true,
          signaling_controller: params.signaling_controller
        });
        return;
      }
    }
  });

  /**
   * Calling joinRoom will both join the room on the signaling server and announce itself to other peers
   */
  params.signaling_controller.joinRoom(params);

  return {
    id: params.room_id,
    peer_id: params.peer_id,
    peers: () => [],
    subscribe: (handler) => {
      return () => {};
    },
    destroy: () => {
      unsubscribe();
    }
  };
};
