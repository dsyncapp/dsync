import * as Next from "@nextui-org/react";
import styled from "styled-components";
import { Room } from "../state";
import * as React from "react";

import JoinRoomModal from "./join-room-modal";

type Props = {
  rooms: Room[];
  onRoomSelected: (room: Room) => void;
  onCreateRoomClicked: () => void;
  onRoomJoined: (room_id: string) => void;
};

const Container = styled(Next.Container)`
  width: 300px;
`;

export const RoomSelector: React.FC<Props> = (props) => {
  const join_modal = Next.useModal();

  return (
    <Container>
      <Next.Text>No Room Selected</Next.Text>

      {props.rooms.map((room) => {
        return (
          <Next.Row key={room.id}>
            <Next.Card style={{ margin: 4 }} onClick={() => props.onRoomSelected(room)} hoverable bordered>
              {room.id}
            </Next.Card>
          </Next.Row>
        );
      })}

      <Next.Button flat auto onClick={props.onCreateRoomClicked}>
        New Room
      </Next.Button>

      <Next.Button flat auto onClick={() => join_modal.setVisible(true)}>
        Join Room
      </Next.Button>

      <JoinRoomModal
        {...join_modal.bindings}
        onJoin={(room_id) => {
          props.onRoomJoined(room_id);
          join_modal.setVisible(false);
        }}
      />
    </Container>
  );
};

export default RoomSelector;
