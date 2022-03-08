import * as mobx from "mobx-react-lite";
import type { NextPage } from "next";
import * as store from "./store";
import * as React from "react";

import * as UI from "@dsyncapp/ui-components";

const Root: NextPage = mobx.observer(() => {
  React.useEffect(() => {
    store.loadRooms();
  }, []);

  return (
    <div style={{ height: "600px", width: "400px" }}>
      {store.state.active_room ? (
        <p>In a Room!</p>
      ) : (
        <UI.RoomSelector
          rooms={store.state.rooms}
          onRoomSelected={store.joinRoom}
          onCreateRoomClicked={store.createRoom}
          onRoomJoined={store.joinRoom}
          onRoomDelete={store.deleteRoom}
        />
      )}
    </div>
  );
});

export default Root;
