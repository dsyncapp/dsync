import * as constants from "../constants";
import styled from "styled-components";
import * as api from "@dsyncapp/api";
import * as hooks from "../hooks";
import * as store from "../store";
import * as React from "react";
import * as _ from "lodash";

import * as UI from "@dsyncapp/ui-components";
import ManualSource from "./manual-source";
import WebSource from "./web-source";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  width: 100%;
  height: 100%;
`;

type Props = {
  rooms: api.rooms.Room[];
  room: api.rooms.Room;
};

export const ActiveRoom: React.FC<Props> = (props) => {
  const [manager, setManager] = React.useState<api.player_managers.PlayerManager | undefined>();

  const [source_type, setSourceType] = React.useState(UI.SourceType.Manual);

  const fullscreen = hooks.useFullscreenObserver();
  const room_state = hooks.useRoomState(props.room);

  const active_source = room_state.metadata.source || "";

  React.useEffect(() => {
    if (!manager) {
      return;
    }

    return api.player_managers.bindPlayerToRoom({
      manager: manager,
      room: props.room,
      peer_id: constants.process_id
    });
  }, [manager]);

  let source;
  switch (source_type) {
    case UI.SourceType.Embedded: {
      if (!active_source) {
        break;
      }
      source = <WebSource source={active_source} onMount={setManager} />;
      break;
    }
    case UI.SourceType.Manual: {
      source = <ManualSource onMount={setManager} />;
      break;
    }
  }

  return (
    <Container>
      <UI.AddressBar
        rooms={props.rooms}
        active_room={props.room}
        fullscreen={fullscreen}
        room_state={room_state}
        onRoomClicked={(room) => store.joinRoom(room.id)}
        onCreateRoomClicked={store.createRoom}
        onRoomJoined={store.joinNewRoom}
        source_type={source_type}
        onSourceTypeChange={setSourceType}
        onLeaveRoomClicked={store.leaveRoom}
        onActiveSourceChange={(source) => {
          props.room.setSource(source, constants.process_id);
        }}
      />

      {source}
    </Container>
  );
};

export default ActiveRoom;
