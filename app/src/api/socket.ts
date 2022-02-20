import * as protocols from "@dsyncapp/protocols";

export type CreateSocketClientParams = {
  endpoint: string;
  socket_id: string;
};

export const createSocketClient = (params: CreateSocketClientParams) => {
  const endpoint = `ws://${params.endpoint}`;

  const rooms = new Set<string>();

  const socket = protocols.createSocketClient({
    endpoint: endpoint,
    codec: protocols.SignalingEventCodec,
    handshake: async (socket) => {
      socket?.send(
        protocols.SignalingEventCodec.encode({
          type: protocols.EventType.Connect,
          id: params.socket_id
        })
      );

      rooms.forEach((room) => {
        socket?.send(
          protocols.SignalingEventCodec.encode({
            type: protocols.EventType.Join,
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
        type: protocols.EventType.Join,
        id: room_id
      });
      return () => {
        rooms.delete(room_id);
        socket.send({
          type: protocols.EventType.Leave,
          id: room_id
        });
      };
    },
    subscribe: (handler: protocols.Listener<protocols.SyncEvent>) => {
      return socket.subscribe((event) => {
        if (event.type === protocols.EventType.Sync) {
          handler(event);
        }
      });
    }
  };
};
