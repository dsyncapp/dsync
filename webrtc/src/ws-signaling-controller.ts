import * as protocols from "@dsyncapp/protocols";
import * as peers from "./peers";
import * as uuid from "uuid";

export type WebSocketSignalingControllerParams = {
  peer_id: string;
  endpoint: string;
};

export const createWebSocketSignalingController = (
  params: WebSocketSignalingControllerParams
): protocols.p2p.SignalingController => {
  const socket = protocols.ws.createSocketClient({
    endpoint: params.endpoint,
    codec: protocols.signaling.Codec,
    handshake: (socket) => {
      socket.send(
        protocols.signaling.Codec.encode({
          type: protocols.signaling.EventType.Connect,
          id: params.peer_id
        })
      );
    },
    onDisconnect: () => {
      console.log("disconnected");
    }
  });

  return {
    send: (event) => {
      socket.send({
        type: protocols.signaling.EventType.Signal,
        payload: event
      });
    },
    joinRoom: (params) => {
      socket.send({
        type: protocols.signaling.EventType.Join,
        id: params.room_id
      });

      socket.send({
        type: protocols.signaling.EventType.Signal,
        payload: {
          type: protocols.p2p.SignalingEventType.Announce,
          sender_peer_id: params.peer_id,
          room_id: params.room_id
        }
      });

      return () => {
        socket.send({
          type: protocols.signaling.EventType.Leave,
          id: params.room_id
        });
      };
    },
    subscribe: (handler) => {
      return socket.subscribe((event) => {
        if (event.type === protocols.signaling.EventType.Signal) {
          handler(event.payload);
        }
      });
    }
  };
};
