import * as signaling_events from "@dsync/signaling-events";
import * as ws from "ws";

const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;

const server = new ws.WebSocketServer({
  path: '/',
  host: '0.0.0.0',
  port: PORT
});

type Client = {
  id: string;
  name: string;
  socket: ws.WebSocket;
  rooms: Set<string>;
};

const clients = new Map<string, Client>();
const rooms = new Map<string, Set<string>>();

server.on("connection", (socket) => {
  console.log("Client connected");

  let id: string | undefined;

  socket.on("message", (message) => {
    const event = signaling_events.decode(message.toString());
    if (!event) {
      return;
    }

    if (!id) {
      if (event.type === signaling_events.EventType.Connect) {
        console.log(`Client registered itself has ${event.id}`);

        id = event.id;
        clients.set(id, {
          id: event.id,
          name: event.name,
          socket: socket,
          rooms: new Set()
        });
      }
      return;
    }

    const client = clients.get(id);
    if (!client) {
      console.log("Unexpected error occurred. Registered client is not present in store!");
      socket.terminate();
      return;
    }

    switch (event.type) {
      case signaling_events.EventType.Join: {
        const room = rooms.get(event.id) || new Set();

        room.add(client.id);
        client.rooms.add(event.id);

        rooms.set(event.id, room);

        console.log(`Client ${id} has joined room ${event.id}`);
        return;
      }

      case signaling_events.EventType.Leave: {
        const room = rooms.get(event.id);
        if (!room) {
          return;
        }

        room.delete(client.id);
        client.rooms.delete(event.id);

        if (room.size === 0) {
          rooms.delete(event.id);
        } else {
          rooms.set(event.id, room);
        }

        console.log(`Client ${id} has left room ${event.id}`);
        return;
      }

      case signaling_events.EventType.Sync: {
        const room = rooms.get(event.room_id);
        if (!room) {
          console.log(`Client ${id} is emitting sync event to unregistered room`);
          return;
        }

        console.log(`Client ${id} is emitting sync event to room ${event.room_id}`);

        room.forEach((id) => {
          const member = clients.get(id);
          if (!member) {
            return;
          }

          if (member.id === client.id) {
            return;
          }

          member.socket.send(JSON.stringify(event));
        });

        return;
      }
    }
  });

  socket.on('close', () => {
    if (!id) {
      console.log("Client disconnected")
      return
    }

      const client = clients.get(id)
      console.log(`Client ${id} disconnected`)

      if (!client) {
        return
      }

      clients.delete(client.id)

     // cleanup
  })
});

server.on("error", (err) => {
  console.log(err);
});

server.on("listening", () => {
  console.log(`listening on port ${PORT}`);
});
