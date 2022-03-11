import * as protocols from "@dsyncapp/protocols";
import * as ws from "ws";

const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;

const server = new ws.WebSocketServer({
  path: "/",
  host: "0.0.0.0",
  port: PORT
});

type Client = {
  id: string;
  socket: ws.WebSocket;
};

const clients = new Map<string, Client>();
const rooms = new Map<string, Set<string>>();

const createPingManager = (onTimeout: () => void) => {
  let timeout = setTimeout(onTimeout, 10000);
  return {
    terminate: () => {
      clearTimeout(timeout);
    },
    heartbeat: () => {
      clearTimeout(timeout);
      timeout = setTimeout(onTimeout, 10000);
    }
  };
};

server.on("connection", (socket) => {
  console.log("Client connected");

  let id: string | undefined;
  const joined_rooms = new Set<string>();

  const ping_manager = createPingManager(() => {
    console.log(`Client ${id || "unknown"} timed out`);
    socket.close();
  });

  setInterval(() => {
    socket.ping();
  }, 5000);

  socket.on("pong", () => {
    ping_manager.heartbeat();
  });

  socket.on("message", (message) => {
    if (Array.isArray(message)) {
      return;
    }
    const event = protocols.server.ServerEventCodec.decode(Buffer.from(message));

    if (!id) {
      if (event.type === protocols.server.EventType.Connect) {
        console.log(`Client registered itself as ${event.id}`);

        id = event.id;
        clients.set(id, {
          id,
          socket
        });
      }
      return;
    }

    switch (event.type) {
      case protocols.server.EventType.Join: {
        const room = rooms.get(event.id) || new Set();
        rooms.set(event.id, room);

        room.add(id);
        joined_rooms.add(event.id);

        console.log(`Client ${id} has joined room ${event.id}`);
        return;
      }

      case protocols.server.EventType.Leave: {
        const room = rooms.get(event.id);
        if (!room) {
          return;
        }

        room.delete(id);
        joined_rooms.delete(event.id);

        if (room.size === 0) {
          rooms.delete(event.id);
        }

        console.log(`Client ${id} has left room ${event.id}`);
        return;
      }

      case protocols.server.EventType.Signal: {
        if ("room_id" in event.payload) {
          const room = rooms.get(event.payload.room_id);
          if (!room) {
            console.log(`Client ${id} is emitting sync event to unregistered room`);
            return;
          }

          console.log(`Client ${id} is emitting sync event to room ${event.payload.room_id}`);

          room.forEach((member_id) => {
            if (member_id === id) {
              return;
            }

            const member = clients.get(member_id);
            if (!member) {
              return;
            }

            if (member.socket.readyState === ws.WebSocket.OPEN) {
              member.socket.send(protocols.server.ServerEventCodec.encode(event));
            }
          });

          return;
        }

        const peer = clients.get(event.payload.peer_id);
        if (!peer) {
          console.log(`Client ${id} is emitting signal to unregistered peer`);
          return;
        }

        console.log(`Client ${id} is emitting signal to peer ${event.payload.peer_id}`);
        if (peer.socket.readyState === ws.WebSocket.OPEN) {
          peer.socket.send(protocols.server.ServerEventCodec.encode(event));
        }

        return;
      }

      case protocols.server.EventType.PeerEvent: {
        const room = rooms.get(event.room_id);
        if (!room) {
          console.log(`Client ${id} is emitting sync event to unregistered room`);
          return;
        }

        console.log(`Client ${id} is emitting sync event to room ${event.room_id}`);

        room.forEach((member_id) => {
          if (member_id === id) {
            return;
          }

          const member = clients.get(member_id);
          if (!member) {
            return;
          }

          if (member.socket.readyState === ws.WebSocket.OPEN) {
            member.socket.send(protocols.server.ServerEventCodec.encode(event));
          }
        });

        return;
      }
    }
  });

  socket.on("close", () => {
    ping_manager.terminate();

    if (!id) {
      console.log("Client disconnected");
      return;
    }

    console.log(`Client ${id} disconnected`);

    clients.delete(id);

    joined_rooms.forEach((room_id) => {
      const room = rooms.get(room_id);
      if (!room) {
        return;
      }

      room.delete(id!);
    });
  });
});

server.on("error", (err) => {
  console.log(err);
});

server.on("listening", () => {
  console.log(`listening on port ${PORT}`);
});
