import * as signaling_events from "@dsyncapp/signaling-events";
import * as ws from "ws";

const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;

const server = new ws.WebSocketServer({
  path: "/",
  host: "0.0.0.0",
  port: PORT
});

type Client = {
  id: string;
  socket_id: string;
  name: string;
  socket: ws.WebSocket;
  rooms: Set<string>;
};

const clients = new Map<string, Client>();
const rooms = new Map<string, Set<string>>();

server.on("connection", (socket) => {
  console.log("Client connected");

  let socket_id: string | undefined;

  socket.on("message", (message) => {
    const event = signaling_events.decode(message.toString());
    if (!event) {
      return;
    }

    if (!socket_id) {
      if (event.type === signaling_events.EventType.Connect) {
        console.log(`Client registered itself as ${event.socket_id}[${event.client_id}]`);

        socket_id = event.socket_id;
        clients.set(socket_id, {
          id: event.client_id,
          socket_id: event.socket_id,
          name: event.name,
          socket: socket,
          rooms: new Set()
        });
      }
      return;
    }

    const client = clients.get(socket_id);
    if (!client) {
      console.log("Unexpected error occurred. Registered client is not present in store!");
      socket.terminate();
      return;
    }

    switch (event.type) {
      case signaling_events.EventType.Join: {
        const room = rooms.get(event.id) || new Set();

        room.add(client.socket_id);
        client.rooms.add(event.id);

        rooms.set(event.id, room);

        console.log(`Client ${socket_id}[${client.id}] has joined room ${event.id}`);
        return;
      }

      case signaling_events.EventType.Leave: {
        const room = rooms.get(event.id);
        if (!room) {
          return;
        }

        room.delete(client.socket_id);
        client.rooms.delete(event.id);

        if (room.size === 0) {
          rooms.delete(event.id);
        } else {
          rooms.set(event.id, room);
        }

        console.log(`Client ${socket_id}[${client.id}] has left room ${event.id}`);
        return;
      }

      case signaling_events.EventType.Sync: {
        const room = rooms.get(event.room_id);
        if (!room) {
          console.log(`Client ${client.id} is emitting sync event to unregistered room`);
          return;
        }

        console.log(`Client ${socket_id}[${client.id}] is emitting sync event to room ${event.room_id}`);

        room.forEach((id) => {
          const member = clients.get(id);
          if (!member) {
            return;
          }

          if (member.socket_id === client.socket_id) {
            return;
          }

          member.socket.send(JSON.stringify(event));
        });

        return;
      }
    }
  });

  socket.on("close", () => {
    if (!socket_id) {
      console.log("Client disconnected");
      return;
    }

    const client = clients.get(socket_id);
    console.log(`Client ${socket_id}[${client?.id}] disconnected`);

    if (!client) {
      return;
    }

    clients.delete(socket_id);

    // cleanup
  });
});

server.on("error", (err) => {
  console.log(err);
});

server.on("listening", () => {
  console.log(`listening on port ${PORT}`);
});
