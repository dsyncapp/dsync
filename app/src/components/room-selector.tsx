import * as Next from "@nextui-org/react";
import styled from "styled-components";
import { Room } from "../state";
import * as React from "react";

type Props = {
  rooms: Room[];
  onRoomSelected: (room: Room) => void;
  onCreateRoomClicked: () => void;
};

const Container = styled(Next.Container)`
  width: 300px;
`;

export const RoomSelector: React.FC<Props> = (props) => {
  const [room_id, setRoomId] = React.useState("");

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
    </Container>
  );
};

export default RoomSelector;
