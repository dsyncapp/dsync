import * as protocols from "@dsyncapp/protocols";
import * as defs from "../definitions";

export type CreateSocketClientParams = defs.CreateClientParams & {
  endpoint: string;
};

export const createWebSocketClient = (params: CreateSocketClientParams): defs.Client => {
  const codec = protocols.server.ServerEventCodec;

  const socket = protocols.ws.createSocketClient({
    endpoint: params.endpoint,
    codec: codec,
    handshake: async (socket) => {
      socket?.send(
        codec.encode({
          type: protocols.server.EventType.Connect,
          id: params.peer_id
        })
      );

      socket?.send(
        codec.encode({
          type: protocols.server.EventType.Join,
          id: params.room_id
        })
      );
    }
  });

  return {
    send: async (event) => {
      socket.send({
        type: protocols.server.EventType.PeerEvent,
        room_id: params.room_id,
        payload: event
      });
    },
    subscribe: (handler) => {
      return socket.subscribe((event) => {
        if (event.type === protocols.server.EventType.PeerEvent) {
          handler(event.payload);
        }
      });
    },
    disconnect: () => {
      socket.disconnect();
    }
  };
};
