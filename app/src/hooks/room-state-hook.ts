import * as api from "@dsyncapp/api";
import * as React from "react";
import * as _ from "lodash";

export const useRoomState = (room: api.rooms.Room) => {
  const [state, setState] = React.useState<api.rooms.RoomState>(room.getState());

  React.useEffect(() => {
    return room.observe((event) => {
      if (_.isEqual(event.current, state)) {
        return;
      }
      setState(event.current);
    });
  }, []);

  return state;
};
