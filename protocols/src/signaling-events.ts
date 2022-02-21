import * as codecs from "./codecs";
import * as t from "zod";

export enum EventType {
  Connect = "connect",
  Sync = "sync",
  Join = "join",
  Leave = "leave"
}

export const ConnectEvent = t.object({
  type: t.literal(EventType.Connect),
  id: t.string()
});

export const RoomEvent = t.object({
  type: t.literal(EventType.Join).or(t.literal(EventType.Leave)),
  id: t.string()
});

const buffer = t
  .any()
  .refine((t) => Buffer.isBuffer(t))
  .transform((t) => t as Buffer);

export const SyncEvent = t.object({
  type: t.literal(EventType.Sync),
  room_id: t.string(),
  patch: buffer.optional(),
  vector: buffer.optional()
});
export type SyncEvent = t.infer<typeof SyncEvent>;

export const Event = ConnectEvent.or(RoomEvent).or(SyncEvent);
export type Event = t.infer<typeof Event>;

export const Codec = codecs.createBSONCodec((data: Event) => {
  Event.parse(data);
  return true;
});
