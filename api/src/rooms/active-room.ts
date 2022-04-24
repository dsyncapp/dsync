import * as protocols from "@dsyncapp/protocols";
import * as clients from "../clients";
import * as utils from "./utils";
import * as room from "./room";

export type BindRoomToSocketParams = {
  client: clients.Client;
  room: room.Room;
  peer_id: string;
};

const bindRoomToSocket = (params: BindRoomToSocketParams) => {
  console.log(`Binding room ${params.room.id} to socket`);

  return params.room.observe((event) => {
    if (event.origin !== params.peer_id) {
      return;
    }

    console.debug(`Emitting patch of size ${event.patch.length}B to peers`);
    params.client.send({
      type: protocols.p2p.PeerEventType.Patch,
      patch: Buffer.from(event.patch)
    });
  });
};

type CreateRoomParams = {
  client: clients.Client;
  room: room.Room;
  peer_id: string;
};

export const activateRoom = (params: CreateRoomParams) => {
  const subscription = params.client.subscribe((event) => {
    switch (event.type) {
      case protocols.p2p.PeerEventType.Sync: {
        if (!params.room.synced) {
          return;
        }

        console.log("Peer requested full sync");
        return params.client.send({
          type: protocols.p2p.PeerEventType.Patch,
          patch: params.room.encode(),
          vector: params.room.getVector()
        });
      }
      case protocols.p2p.PeerEventType.Patch: {
        if (event.patch) {
          return params.room.applyUpdate(event.patch);
        }

        if (event.vector && params.room.synced) {
          if (!utils.stateVectorsAreEqual(event.vector, params.room.getVector())) {
            console.log("Peer vector is out of sync. Emitting missing difference");
            params.client.send({
              type: protocols.p2p.PeerEventType.Patch,
              patch: params.room.encode(event.vector)
            });
          }
          return;
        }
      }
    }
  });

  const interval = setInterval(() => {
    if (!params.room.synced) {
      return params.client.send({
        type: protocols.p2p.PeerEventType.Sync
      });
    }

    params.client.send({
      type: protocols.p2p.PeerEventType.Patch,
      vector: params.room.getVector()
    });
  }, 5000);

  const binding = bindRoomToSocket({
    room: params.room,
    client: params.client,
    peer_id: params.peer_id
  });

  return {
    shutdown: () => {
      subscription();
      clearInterval(interval);
      binding();
    }
  };
};
