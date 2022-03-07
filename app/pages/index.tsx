import * as mobx from "mobx-react-lite";
import type { NextPage } from "next";
import * as React from "react";

import * as constants from "../src/constants";
import * as api from "@dsyncapp/api";

import * as store from "../src/store";
import * as hooks from "../src/hooks";

import RoomSelector from "../src/components/room-selector";
import Room from "../src/components/room";

const Home: NextPage = mobx.observer(() => {
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    setLoading(true);

    (async () => {
      try {
        await store.loadRooms();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  React.useEffect(() => {
    if (!store.state.active_room) {
      return;
    }
    const activation = api.rooms.activateRoom({
      room: store.state.active_room,
      peer_id: constants.process_id,
      client: api.clients.createWebSocketClient({
        endpoint: constants.ENV.API_ENDPOINT,
        peer_id: constants.process_id,
        room_id: store.state.active_room.id
      })
    });

    return activation.shutdown;
  }, [store.state.active_room]);

  if (loading) {
    return <p>Loading</p>;
  }

  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      {store.state.active_room?.synced ? (
        <Room rooms={store.state.rooms} room={store.state.active_room} />
      ) : store.state.active_room ? (
        <p>Room loading</p>
      ) : (
        <RoomSelector
          rooms={store.state.rooms}
          onRoomSelected={(room) => store.joinRoom(room.id)}
          onCreateRoomClicked={store.createRoom}
          onRoomJoined={store.joinNewRoom}
          onRoomDelete={store.deleteRoom}
        />
      )}
    </div>
  );
});

export default Home;
