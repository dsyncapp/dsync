import * as api from "@dsyncapp/api";

export enum FromProcess {
  ContentScript = "content-script",
  Background = "extension-background",
  UI = "extension-ui"
}

export type ActiveRoom = {
  id: string;
  name?: string;
  source: string;
  peers: Record<string, api.rooms.Peer>;
};

export type ExtensionState = {
  rooms: Array<{
    id: string;
    name: string;
  }>;

  active_room?: ActiveRoom;
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

export type NewIframeNotification = {
  type: "new-iframe";
};

export type UIEvent =
  | GetState
  | StateChangedEvent
  | JoinRoom
  | CreateRoom
  | LeaveRoom
  | DeleteRoom
  | NewIframeNotification;

export const sendMessage = (from: FromProcess, event: UIEvent) => {
  chrome.runtime.sendMessage({
    from,
    ...event
  });
};

export const subscribeToMessages = (
  from: FromProcess,
  listener: (event: UIEvent, sender: chrome.runtime.MessageSender) => void
) => {
  const handler = (event: UIEvent & { from: FromProcess }, sender: chrome.runtime.MessageSender) => {
    if (event && event.from === from) {
      listener(event, sender);
    }
  };

  chrome.runtime.onMessage.addListener(handler);
  return () => {
    chrome.runtime.onMessage.removeListener(handler);
  };
};
