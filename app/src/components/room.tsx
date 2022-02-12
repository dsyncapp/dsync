import * as video_managers from "../video-managers";
import * as Next from "@nextui-org/react";
import * as React from "react";
import { Room } from "../api";

import { StateContext } from "../context";

import AddressBar, { SourceType } from "./address-bar";
import ManualSource from "./manual-source";
import WebSource from "./web-source";

type Props = {
  room: Room;
};

export const ActiveRoom: React.FC<Props> = (props) => {
  const video_manager = React.useRef<video_managers.VideoManager | null>(null);

  const [active_source, setActiveSource] = React.useState("");

  const [source_type, setSourceType] = React.useState(SourceType.Web);

  const [context, api] = React.useContext(StateContext);

  React.useEffect(() => {
    const interval = setInterval(() => {
      api.sync(props.room.id);
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [props.room.id]);

  React.useEffect(() => {
    if (!props.room.state) {
      return;
    }

    return props.room.state.observe(active_source, (current, previous, changed) => {
      if (changed.includes("playing")) {
        if (current.playing === previous.playing) {
          return;
        }
        if (current.playing) {
          video_manager.current?.resume();
        } else {
          video_manager.current?.pause();
        }
      }

      if (changed.includes("position")) {
        if (current.position && current.position !== previous.position) {
          video_manager.current?.seek(current.position);
        }
      }
    });
  }, [active_source, props.room]);

  const onManagerLoaded = (manager: video_managers.VideoManager) => {
    video_manager.current = manager;

    console.log("loaded", active_source, props.room.state)
    if (active_source && props.room.state) {
      const state = props.room.state.read(active_source);
      if (state.playing) {
        video_manager.current.resume();
      } else {
        video_manager.current.pause();
      }
    }
  };

  const hooks: video_managers.VideoManagerHooks = {
    onPause: () => {
      console.log("paused");
      props.room.state?.pause(active_source);
    },
    onResume: () => {
      console.log("resumed");
      props.room.state?.resume(active_source);
    },
    onSeek: (time) => {
      console.log("seeked to new position", time);
      props.room.state?.seek(active_source, time);
    }
  };

  let source;

  switch (source_type) {
    case SourceType.Web: {
      if (!active_source) {
        break;
      }

      source = <WebSource source={active_source} ref={onManagerLoaded} {...hooks} />;
      break;
    }
    case SourceType.Manual: {
      source = <ManualSource ref={onManagerLoaded} {...hooks} />;
      break;
    }
  }

  return (
    <Next.Container style={{ margin: 0, padding: 0, height: "100%" }}>
      <AddressBar
        rooms={context.rooms}
        active_room={props.room.id}
        onRoomClicked={(room) => api.activateRoom(room.id)}
        onCreateRoomClicked={() => api.createRoom()}
        onRoomJoined={(id) => api.joinRoom(id)}
        source_type={source_type}
        onSourceTypeChange={setSourceType}
        active_source={active_source}
        onActiveSourceChange={setActiveSource}
      />

      {source}

      {/* <Next.Button onClick={reload}>Reload</Next.Button>

      <Next.Button onClick={() => video_manager.current?.resume()}>Resume</Next.Button>
      <Next.Button onClick={() => video_manager.current?.pause()}>Pause</Next.Button> */}
    </Next.Container>
  );
};

export default ActiveRoom;
