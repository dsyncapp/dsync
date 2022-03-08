import * as browser from "webextension-polyfill";
import * as api from "@dsyncapp/api";

export enum FromProcess {
  Background = "extension-background",
  UI = "extension-ui"
}

export type ExtensionState = {
  rooms: Array<{
    id: string;
    name: string;
  }>;

  active_room?: {
    id: string;
    source: string;
    peers: Record<string, api.rooms.Peer>;
  };
};

export type StateChangedEvent = {
  type: "state-changed";
  state: ExtensionState;
};

export type GetState = {
  type: "get-state";
};

export type JoinRoom = {
  type: "join-room";
  room_id: string;
};

export type CreateRoom = {
  type: "create-room";
  name: string;
};

export type LeaveRoom = {
  type: "leave-room";
  room_id: string;
};

export type DeleteRoom = {
  type: "delete-room";
  room_id: string;
};

export type UIEvent = GetState | StateChangedEvent | JoinRoom | CreateRoom | LeaveRoom | DeleteRoom;

export const sendMessage = (from: FromProcess, event: UIEvent) => {
  browser.runtime.sendMessage({
    from,
    ...event
  });
};

export const subscribeToMessages = (from: FromProcess, listener: (event: UIEvent) => void) => {
  const handler = (event: UIEvent & { from: FromProcess }) => {
    if (event && event.from === from) {
      listener(event);
    }
  };

  browser.runtime.onMessage.addListener(handler);
  return () => {
    browser.runtime.onMessage.removeListener(handler);
  };
};
