import * as hookstate from "@hookstate/core";
import * as state from "../state";
import * as React from "react";
import * as api from "../api";
import * as _ from "lodash";

export const useRoomState = (room?: hookstate.State<state.Room>) => {
  const [room_state, setRoomState] = React.useState<api.room_state.SerializedRoomState | undefined>();

  React.useEffect(() => {
    const state = room?.state.value;
    if (!room || !state) {
      if (room_state) {
        setRoomState(undefined);
      }
      return;
    }

    setRoomState(state.toJSON());

    return state.observe(() => {
      const next = state.toJSON();
      if (_.isEqual(next, room_state)) {
        return;
      }
      setRoomState(next);
    });
  }, [room?.value.id, !!room?.state.value]);

  return room_state;
};
