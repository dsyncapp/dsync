import * as Next from "@nextui-org/react";
import * as Icons from "@geist-ui/icons";
import * as React from "react";

import * as api from "@dsyncapp/api";

import CreateRoomModal from "./create-room-modal";
import JoinRoomModal from "./join-room-modal";
import DropDown from "./drop-down";

export enum SourceType {
  Embedded = "embedded",
  Manual = "manual"
}

type Props = {
  rooms: api.rooms.Room[];
  active_room: api.rooms.Room;

  fullscreen: boolean;
  room_state: api.rooms.RoomState;

  onRoomClicked: (room: api.rooms.Room) => void;
  onCreateRoomClicked: (name: string) => void;
  onRoomJoined: (room_id: string) => void;
  onLeaveRoomClicked: () => void;

  onActiveSourceChange: (source: string) => void;

  source_type: SourceType;
  onSourceTypeChange: (type: SourceType) => void;
};

export const AddressBar: React.FC<Props> = (props) => {
  const join_modal = Next.useModal();
  const create_modal = Next.useModal();

  const source_input = React.useRef<HTMLInputElement | null>(null);
  const [source, setSource] = React.useState("");

  React.useEffect(() => {
    if (props.room_state.metadata.source !== source) {
      setSource(props.room_state.metadata.source || "");
    }
  }, [props.room_state.metadata.source]);

  let style: any = {};
  if (props.fullscreen) {
    style.display = "none";
  }

  return (
    <Next.Grid.Container style={{ padding: 5, ...style }} alignItems="center">
      <Next.Grid>
        <DropDown
          active={props.source_type}
          onSelect={(item) => {
            props.onSourceTypeChange(item.value as SourceType);
          }}
          items={[
            {
              value: SourceType.Embedded,
              name: "Embedded Browser"
            },
            {
              value: SourceType.Manual,
              name: "Local"
            }
          ]}
        />
      </Next.Grid>

      <Next.Grid xs>
        <Next.Input
          ref={source_input}
          animated={false}
          labelLeft={"source"}
          size="xs"
          fullWidth
          onChange={(e) => setSource(e.target.value)}
          value={source}
          onBlur={() => {
            setSource(props.room_state.metadata.source || "");
          }}
          onKeyPress={(key) => {
            if (key.code === "Enter") {
              props.onActiveSourceChange(source);
            }
          }}
        ></Next.Input>
      </Next.Grid>

      <Next.Grid>
        <Next.Tooltip content="Room ID Copied to Clipboard!" trigger="click" placement="bottom" color="primary">
          <Next.Button
            size="xs"
            flat
            color="warning"
            style={{ textOverflow: "ellipsis", marginLeft: 10 }}
            onClick={() => {
              navigator.clipboard.writeText(props.active_room.id);
            }}
          >
            room: {props.room_state.metadata.name || props.active_room.id}
          </Next.Button>
        </Next.Tooltip>
      </Next.Grid>

      <Next.Grid>
        <Next.Button
          auto
          size="xs"
          flat
          color={api.rooms.utils.allPeersReady(props.room_state.peers) ? "success" : "error"}
          style={{ marginLeft: 10 }}
        >
          {api.rooms.utils.filterActivePeers(props.room_state.peers).length}
        </Next.Button>
      </Next.Grid>

      <Next.Grid>
        <Next.StyledButtonGroup style={{ margin: "0 10px 0 10px" }}>
          <Next.Button auto flat size="xs" onClick={() => join_modal.setVisible(true)}>
            Join Room
          </Next.Button>

          <Next.Button
            auto
            flat
            color="success"
            size="xs"
            icon={<Icons.Plus />}
            onClick={() => create_modal.setVisible(true)}
          />
        </Next.StyledButtonGroup>
      </Next.Grid>

      <Next.Grid>
        <Next.Button
          auto
          flat
          size="xs"
          color="secondary"
          icon={<Icons.X size={20} />}
          onClick={props.onLeaveRoomClicked}
        />
      </Next.Grid>

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
    </Next.Grid.Container>
  );
};

export default AddressBar;
