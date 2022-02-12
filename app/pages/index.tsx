import * as Next from "@nextui-org/react";
import type { NextPage } from "next";
import * as React from "react";
import Head from "next/head";

import { StateContext } from "../src/context";

import RoomSelector from "../src/components/room-selector";
import Room from "../src/components/room";

const Home: NextPage = () => {
  const [context, api] = React.useContext(StateContext);

  const room = context.active_room && context.rooms.find((room) => room.id === context.active_room);

  return (
    <Next.Container fluid style={{ padding: 0, margin: 0, height: '100vh' }}>
      {room ? (
        <Room room={room} />
      ) : (
        <RoomSelector rooms={context.rooms} onRoomSelected={(room) => api.activateRoom(room.id)} />
      )}
    </Next.Container>
  );
};

export default Home;
