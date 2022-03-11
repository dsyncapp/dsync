import * as mobx from "mobx-react-lite";
import * as store from "./store";
import * as React from "react";

import * as UI from "@dsyncapp/ui-components";
import Room from "./room";

const App = mobx.observer(() => {
  React.useEffect(() => {
    store.loadRooms();
  }, []);

  return (
    <div style={{ height: "600px", width: "400px" }}>
      {store.state.active_room ? (
        <Room room={store.state.active_room} onLeaveRoomClicked={store.leaveRoom} />
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

export default App;
