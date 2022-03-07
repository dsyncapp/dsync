import * as video_managers from "../player-managers";
import * as protocols from "@dsyncapp/protocols";
import * as constants from "../constants";
import styled from "styled-components";
import * as api from "@dsyncapp/api";
import * as hooks from "../hooks";
import * as store from "../store";
import * as React from "react";
import * as _ from "lodash";

import AddressBar, { SourceType } from "./address-bar";
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

  const [source_type, setSourceType] = React.useState(SourceType.Manual);

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
    case SourceType.Embedded: {
      if (!active_source) {
        break;
      }
      source = <WebSource source={active_source} onMount={setManager} />;
      break;
    }
    case SourceType.Manual: {
      source = <ManualSource onMount={setManager} />;
      break;
    }
  }

  return (
    <Container>
      <AddressBar
        rooms={props.rooms}
        active_room={props.room}
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
