import * as state from "../state";
import * as React from "react";
import * as api from "../api";
import * as _ from "lodash";

export const useRoomState = (state?: api.room_state.RoomState) => {
  const [room_state, setRoomState] = React.useState<api.room_state.SerializedRoomState | undefined>();

  React.useEffect(() => {
    if (!state) {
      if (room_state) {
        setRoomState(undefined);
      }
      return;
    }

    setRoomState(state.toJSON());

    return state.observe(() => {
      const next = state!.toJSON();
      if (_.isEqual(next, room_state)) {
        return;
      }
      setRoomState(next);
    });
  }, [!!state]);

  return room_state;
};
