import * as protocols from "@dsyncapp/protocols";

export type CreateSocketClientParams = {
  endpoint: string;
  socket_id: string;
};

export const createSocketClient = (params: CreateSocketClientParams) => {
  const endpoint = `ws://${params.endpoint}`;

  const rooms = new Set<string>();

  const socket = protocols.ws.createSocketClient({
    endpoint: endpoint,
    codec: protocols.signaling.Codec,
    handshake: async (socket) => {
      socket?.send(
        protocols.signaling.Codec.encode({
          type: protocols.signaling.EventType.Connect,
          id: params.socket_id
        })
      );

      rooms.forEach((room) => {
        socket?.send(
          protocols.signaling.Codec.encode({
            type: protocols.signaling.EventType.Join,
            id: room
          })
        );
      });
    }
  });

  return {
    send: socket.send,
    joinRoom: (room_id: string) => {
      rooms.add(room_id);
      socket.send({
        type: protocols.signaling.EventType.Join,
        id: room_id
      });
      return () => {
        rooms.delete(room_id);
        socket.send({
          type: protocols.signaling.EventType.Leave,
          id: room_id
        });
      };
    },
    subscribe: (handler: protocols.ws.Listener<protocols.signaling.SyncEvent>) => {
      return socket.subscribe((event) => {
        if (event.type === protocols.signaling.EventType.Sync) {
          handler(event);
        }
      });
    }
  };
};
