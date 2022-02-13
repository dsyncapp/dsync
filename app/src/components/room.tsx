import * as video_managers from "../video-managers";
import styled from "styled-components";
import * as state from "../state";
import * as React from "react";
import * as api from "../api";

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
  room_state: api.room_state.SerializedRoomState;
  room: state.Room;
  rooms: state.Room[];
};

export const ActiveRoom: React.FC<Props> = (props) => {
  const video_manager = React.useRef<video_managers.VideoManager | null>(null);

  const previous_state = React.useRef<api.room_state.SerializedRoomState | undefined>();
  const [source_type, setSourceType] = React.useState(SourceType.Web);

  const active_source = props.room_state.metadata.source;

  const source_state = props.room_state.sources[active_source];
  const previous_source_state = previous_state.current?.sources[active_source];

  React.useEffect(() => {
    if (!source_state) {
      return;
    }

    if (source_state.playing !== previous_source_state?.playing) {
      if (source_state.playing) {
        video_manager.current?.resume();
      } else {
        video_manager.current?.pause();
      }
    }

    if (source_state.position !== previous_source_state?.position) {
      if (source_state.position) {
        video_manager.current?.seek(source_state.position);
      }
    }

    previous_state.current = props.room_state;
  }, [props.room_state]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      video_manager.current?.getState().then((status) => {
        // console.log(status);
      });
    }, 500);
    return () => {
      clearInterval(interval);
    };
  }, []);

  const onManagerLoaded = (manager: video_managers.VideoManager) => {
    video_manager.current = manager;

    // if (source_state.playing) {
    //   video_manager.current.resume();
    // } else {
    //   video_manager.current.pause();
    // }
  };

  const handleVideoEvent: video_managers.VideoEventHandler = (event) => {
    switch (event.type) {
      case video_managers.PlayerEventType.Navigate: {
        console.log("webview navigated");
        // @ts-ignore
        return props.room.state?.setSource(event.url);
      }

      case video_managers.PlayerEventType.Play: {
        console.log("video resumed");
        return props.room.state?.resume();
      }
      case video_managers.PlayerEventType.Pause: {
        console.log("video paused");
        return props.room.state?.pause();
      }
      case video_managers.PlayerEventType.Seeking: {
        console.log("seeked to new position", event.status.time);
        return props.room.state?.seek(event.status.time);
      }
      default: {
        return console.log(event.type, event.status);
      }
    }
  };

  let source;

  switch (source_type) {
    case SourceType.Web: {
      if (!active_source) {
        break;
      }

      source = <WebSource source={active_source} ref={onManagerLoaded} onEvent={handleVideoEvent} />;
      break;
    }
    case SourceType.Manual: {
      source = <ManualSource ref={onManagerLoaded} onEvent={handleVideoEvent} />;
      break;
    }
  }

  return (
    <Container>
      <AddressBar
        rooms={props.rooms}
        active_room={props.room.id}
        onRoomClicked={(room) => api.rooms.joinKnownRoom(room.id)}
        onCreateRoomClicked={api.rooms.createRoom}
        onRoomJoined={api.rooms.joinNewRoom}
        source_type={source_type}
        onSourceTypeChange={setSourceType}
        active_source={active_source}
        onActiveSourceChange={(source) => {
          props.room.state?.setSource(source);
        }}
      />

      {source}
    </Container>
  );
};

export default ActiveRoom;
