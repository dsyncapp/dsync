import * as Next from "@nextui-org/react";
import * as Icons from "@geist-ui/icons";
import { Room } from "../state";
import * as React from "react";
import * as api from "../api";

import CreateRoomModal from "./create-room-modal";
import JoinRoomModal from "./join-room-modal";
import * as hooks from "../hooks";

export enum SourceType {
  Web = "web",
  Manual = "manual"
}

type Props = {
  rooms: Room[];
  active_room: string;
  room_state: api.room_state.SerializedRoomState;

  onRoomClicked: (room: Room) => void;
  onCreateRoomClicked: (name: string) => void;
  onRoomJoined: (room_id: string) => void;
  onLeaveRoomClicked: () => void;

  active_source: string;
  onActiveSourceChange: (source: string) => void;

  source_type: SourceType;
  onSourceTypeChange: (type: SourceType) => void;
};

export const AddressBar: React.FC<Props> = (props) => {
  const join_modal = Next.useModal();
  const create_modal = Next.useModal();

  const fullscreen = hooks.useFullscreenObserver();

  const source_input = React.useRef<HTMLInputElement | null>(null);
  const [source, setSource] = React.useState("");

  React.useEffect(() => {
    setSource(props.active_source);
  }, [props.active_source]);

  const getSourceIcon = () => {
    switch (props.source_type) {
      case SourceType.Web: {
        return <Icons.Globe size={20} />;
      }
      case SourceType.Manual: {
        return <Icons.Server size={20} />;
      }
    }
  };

  let style: any = {};
  if (fullscreen) {
    style.display = "none";
  }

  return (
    <Next.Grid.Container style={{ padding: 5, ...style }} alignItems="center">
      <Next.Grid>
        <Next.Button
          onClick={() => {
            if (props.source_type === SourceType.Web) {
              props.onSourceTypeChange(SourceType.Manual);
            } else {
              props.onSourceTypeChange(SourceType.Web);
            }

            source_input.current?.focus();
          }}
          icon={getSourceIcon()}
          auto
          bordered
          size="xs"
          style={{ marginRight: 10 }}
        />
      </Next.Grid>

      <Next.Grid xs>
        <Next.Input
          ref={source_input}
          animated={false}
          labelLeft={props.source_type === SourceType.Web ? "address" : "name"}
          size="xs"
          fullWidth
          onChange={(e) => setSource(e.target.value)}
          value={source}
          onBlur={() => {
            setSource(props.active_source);
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
              navigator.clipboard.writeText(props.active_room);
            }}
          >
            room: {props.room_state.metadata.name || props.active_room}
          </Next.Button>
        </Next.Tooltip>
      </Next.Grid>

      <Next.Grid>
        <Next.Button
          auto
          size="xs"
          flat
          color={api.utils.allPeersReady(props.room_state.peers) ? "success" : "error"}
          style={{ marginLeft: 10 }}
        >
          {api.utils.filterActivePeers(props.room_state.peers).length}
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
