import * as Next from "@nextui-org/react";
import type { NextPage } from "next";
import * as React from "react";

import * as state from "../src/state";
import * as hooks from "../src/hooks";
import * as api from "../src/api";

import RoomSelector from "../src/components/room-selector";
import Room from "../src/components/room";

const Home: NextPage = () => {
  const [loading, setLoading] = React.useState(false);
  const { rooms, room } = state.useRooms();

  const room_state = hooks.useRoomState(room?.state);

  React.useEffect(() => {
    setLoading(true);

    (async () => {
      try {
        const rooms = await api.db.getRooms();
        rooms.forEach(api.rooms.observeRoom);
        state.Rooms.merge(rooms);
      } finally {
        setLoading(false);
      }
    })();

    return api.rooms.startRoomSyncLoop();
  }, []);

  if (loading) {
    return <p>Loading</p>;
  }

  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      {room && room_state ? (
        <Room rooms={rooms} room={room} room_state={room_state} />
      ) : room ? (
        <p>Room loading</p>
      ) : (
        <RoomSelector
          rooms={rooms}
          onRoomSelected={(room) => api.rooms.joinKnownRoom(room.id)}
          onCreateRoomClicked={api.rooms.createRoom}
          onRoomJoined={api.rooms.joinNewRoom}
        />
      )}
    </div>
  );
};

export default Home;
