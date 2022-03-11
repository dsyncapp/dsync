import * as Icons from "@geist-ui/icons";
import styled from "styled-components";
import * as socket from "../socket";
import * as React from "react";

import * as Next from "@nextui-org/react";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  width: 100%;
  height: 100%;
`;

const Header = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 10px 5px;
`;

type Props = {
  room: socket.ActiveRoom;
  onLeaveRoomClicked: () => void;
};

export const Room: React.FC<Props> = (props) => {
  return (
    <Container>
      <Header>
        <Next.Tooltip content="Room ID Copied to Clipboard!" trigger="click" placement="bottom" color="primary">
          <Next.Button
            size="lg"
            flat
            color="warning"
            style={{ textOverflow: "ellipsis" }}
            onClick={() => {
              navigator.clipboard.writeText(props.room.id);
            }}
          >
            room: {props.room.name || props.room.id}
          </Next.Button>
        </Next.Tooltip>

        <Next.Button
          auto
          flat
          size="lg"
          color="secondary"
          icon={<Icons.X size={20} />}
          onClick={props.onLeaveRoomClicked}
        />
      </Header>
    </Container>
  );
};

export default Room;
