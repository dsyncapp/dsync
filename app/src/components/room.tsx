import * as video_managers from "../video-managers";
import * as constants from "../constants";
import styled from "styled-components";
import * as state from "../state";
import * as React from "react";
import * as api from "../api";
import * as _ from "lodash";

import AddressBar, { SourceType } from "./address-bar";
import ExtensionSource from "./extension-source";
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

  React.useEffect(() => {
    const room_state = props.room_state;
    const source_state = room_state.sources[active_source];
    const previous = previous_state.current;
    const previous_source_state = previous?.sources[active_source];

    previous_state.current = room_state;

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

    if (source_state.position && source_state.position !== previous_source_state?.position) {
      if (source_state.position > 0) {
        video_manager.current?.seek(source_state.position);
      }
    }

    if (previous) {
      if (
        api.utils.allPeersReady(room_state.peers) &&
        !api.utils.allPeersReady(previous.peers) &&
        source_state.playing
      ) {
        console.log("Resuming as all peers have become ready");
        video_manager.current?.resume();
        return;
      }

      if (!api.utils.allPeersReady(room_state.peers) && api.utils.allPeersReady(previous.peers)) {
        console.log("Pausing as all peers are no longer ready");
        video_manager.current?.pause();
        return;
      }
    }

    const us = room_state.peers[constants.process_id];
    if (!us) {
      return;
    }

    const delta = api.utils.getDeltaFromFurthestPeer(room_state.peers, us);
    if (!delta) {
      return;
    }

    const last_update = source_state.ts || 0;
    if (delta.peer.ts < last_update || us.ts < last_update) {
      return;
    }

    if (api.utils.peerIsReady(delta.peer) && api.utils.peerIsReady(us) && delta.diff > 1) {
      console.log("More than 1s out of sync with furthest peer. Adjusting time");

      video_manager.current?.getState().then((status) => {
        // We adjust in steps to prevent over correcting for small deltas
        video_manager.current?.seek(status.time - delta.diff / 2);
      });

      return;
    }

    if (source_state.playing && us.status.paused && api.utils.allPeersReady(room_state.peers)) {
      video_manager.current?.resume();
    }

    if (!source_state.playing && !us.status.paused) {
      video_manager.current?.pause();
    }
  }, [props.room_state]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      if (!video_manager.current) {
        props.room.state?.updateStatus({
          paused: true,
          seeking: false,
          time: -1
        });
        return;
      }

      video_manager.current.getState().then((status) => {
        props.room.state?.updateStatus(status);

        if (!status.paused && !api.utils.allPeersReady(props.room.state?.toJSON().peers || {})) {
          video_manager.current?.pause();
        }
      });
    }, 500);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const handleVideoEvent: video_managers.VideoEventHandler = (event) => {
    switch (event.type) {
      case video_managers.PlayerEventType.Ready: {
        console.log("Player loaded");
        const room_state = props.room.state!.toJSON();
        const source_state = room_state.sources[room_state.metadata.source];
        if (source_state?.position && source_state.position > 0) {
          console.log("Seeking to", source_state.position);
          video_manager.current?.seek(source_state.position);
        }
      }

      case video_managers.PlayerEventType.Navigate: {
        if (!event.url) {
          return;
        }
        console.log("webview navigated");
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
    }
  };

  let source;

  switch (source_type) {
    case SourceType.Web: {
      if (!active_source) {
        break;
      }

      source = <WebSource source={active_source} ref={video_manager} onEvent={handleVideoEvent} />;
      break;
    }
    case SourceType.Manual: {
      source = <ManualSource ref={video_manager} onEvent={handleVideoEvent} />;
      break;
    }
  }

  return (
    <Container>
      <AddressBar
        rooms={props.rooms}
        active_room={props.room.id}
        room_state={props.room_state}
        onRoomClicked={(room) => api.rooms.joinKnownRoom(room.id)}
        onCreateRoomClicked={api.rooms.createRoom}
        onRoomJoined={api.rooms.joinNewRoom}
        source_type={source_type}
        onSourceTypeChange={setSourceType}
        active_source={active_source}
        onLeaveRoomClicked={api.rooms.leaveRoom}
        onActiveSourceChange={(source) => {
          props.room.state?.setSource(source);
        }}
      />

      {source}
    </Container>
  );
};

export default ActiveRoom;
