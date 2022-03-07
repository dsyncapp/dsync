import * as Next from "@nextui-org/react";
import * as Icons from "@geist-ui/icons";
import styled from "styled-components";
import * as React from "react";

import * as api from "@dsyncapp/api"

import CreateRoomModal from "./create-room-modal";
import JoinRoomModal from "./join-room-modal";

type Props = {
  rooms: api.rooms.Room[];
  onRoomSelected: (room: api.rooms.Room) => void;
  onCreateRoomClicked: (name: string) => void;
  onRoomJoined: (room_id: string) => void;
  onRoomDelete: (room_id: string) => void;
};

const Container = styled(Next.Container)`
  display: flex;
  flex-direction: column;
`;

const Header = styled(Next.Container)`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-direction: row;
`;

export const RoomSelector: React.FC<Props> = (props) => {
  const join_modal = Next.useModal();
  const create_modal = Next.useModal();

  return (
    <Container>
      <Header>
        <Next.Text h1>Dsync</Next.Text>

        <Next.Button.Group>
          <Next.Button flat bordered auto onClick={() => join_modal.setVisible(true)}>
            Join Room
          </Next.Button>

          <Next.Button flat auto bordered onClick={() => create_modal.setVisible(true)}>
            Create Room
          </Next.Button>
        </Next.Button.Group>
      </Header>

      <Next.Spacer />

      {props.rooms.map((room) => {
        const state = room.state?.toJSON();
        return (
          <Next.Row key={room.id}>
            <Next.Card
              style={{ margin: 4, flexDirection: "row" }}
              onClick={() => props.onRoomSelected(room)}
              clickable
              hoverable
              bordered
            >
              <Next.Row fluid justify="space-between" align="center">
                {state?.metadata.name ? state.metadata.name : room.id}

                <Next.Button
                  auto
                  bordered
                  color="error"
                  size="xs"
                  icon={<Icons.Delete size={18} />}
                  style={{ opacity: ".6" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    props.onRoomDelete(room.id);
                  }}
                />
              </Next.Row>
            </Next.Card>
          </Next.Row>
        );
      })}

      <JoinRoomModal
        {...join_modal.bindings}
        onJoin={(room_id) => {
          props.onRoomJoined(room_id);
          join_modal.setVisible(false);
        }}
      />

      <CreateRoomModal
        {...create_modal.bindings}
        onCreate={(name) => {
          props.onCreateRoomClicked(name);
          create_modal.setVisible(false);
        }}
      />
    </Container>
  );
};

export default RoomSelector;
