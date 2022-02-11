import * as t from "zod";

export enum EventType {
  Connect = "connect",
  Sync = "sync",
  Join = "join",
  Leave = "leave"
}

export const ConnectEvent = t.object({
  type: t.literal(EventType.Connect),
  id: t.string(),
  name: t.string()
});

export const RoomEvent = t.object({
  type: t.literal(EventType.Join).or(t.literal(EventType.Leave)),
  id: t.string()
});

export const SyncEventPayload = t.object({
  vector: t.string(),
  patch: t.string()
});
export type SyncEventPayload = t.infer<typeof SyncEventPayload>;

export const SyncEvent = t.object({
  type: t.literal(EventType.Sync),
  room_id: t.string(),
  payload: SyncEventPayload.or(t.null())
});
export type SyncEvent = t.infer<typeof SyncEvent>;

export const Event = ConnectEvent.or(RoomEvent).or(SyncEvent);
export type Event = t.infer<typeof Event>;

export const decode = (data: string) => {
  try {
    const event = JSON.parse(data);
    return Event.parse(event);
  } catch (err) {
    console.log(err);
    return null;
  }
};

export const encode = (data: Event) => {
  return JSON.stringify(data);
};
