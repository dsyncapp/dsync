import * as Next from "@nextui-org/react";
import styled from "styled-components";
import * as React from "react";
import { Room } from "../api";

type Props = {
  rooms: Room[];
  onRoomSelected: (room: Room) => void;
};

const Container = styled(Next.Container)`
  width: 300px;
`;

export const RoomSelector: React.FC<Props> = (props) => {
  const [room_id, setRoomId] = React.useState("");

  return (
    <Container>
      <Next.Text>No Room Selected</Next.Text>

      {/* <Next.Button placeholder="Select Room" size="xl">
        {" "}
        SelectRoom
      </Next.Button> */}

      {props.rooms.map((room) => {
        return (
          <Next.Row key={room.id}>
            <Next.Card style={{ margin: 4 }} onClick={() => props.onRoomSelected(room)} hoverable bordered>
              {room.id}
            </Next.Card>
          </Next.Row>
        );
      })}
    </Container>
  );
};

export default RoomSelector;
