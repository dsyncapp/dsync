import * as signalinG from "./signaling-events";
import * as codecs from "../codecs";
import * as p2p from "./p2p-events";
import * as t from "zod";

export enum EventType {
  Connect = "connect",

  Join = "join",
  Leave = "leave",

  Signal = "signal",

  PeerEvent = "peer-event"
}

export const ConnectEvent = t.object({
  type: t.literal(EventType.Connect),
  id: t.string()
});

export const RoomEvent = t.object({
  type: t.literal(EventType.Join).or(t.literal(EventType.Leave)),
  id: t.string()
});
export type RoomEvent = t.infer<typeof RoomEvent>;

export const SignalEvent = t.object({
  type: t.literal(EventType.Signal),
  payload: signalinG.SignalingEvent
});
export type SignalEvent = t.infer<typeof SignalEvent>;

export const PeerEvent = t.object({
  type: t.literal(EventType.PeerEvent),
  room_id: t.string(),
  payload: p2p.PeerEvent
});
export type PeerEvent = t.infer<typeof PeerEvent>;

export const ServerEvent = ConnectEvent.or(RoomEvent).or(SignalEvent).or(PeerEvent);
export type ServerEvent = t.infer<typeof ServerEvent>;

export const ServerEventCodec = codecs.createBSONCodec((data: ServerEvent) => {
  ServerEvent.parse(data);
  return true;
});
