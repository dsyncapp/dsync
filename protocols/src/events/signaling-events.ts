import * as codecs from "../codecs";
import * as p2p from "./p2p-events";
import * as t from "zod";

export enum SignalingEventType {
  Announce = "announce",
  Connect = "connect",
  Candidate = "candidate",
  Description = "description"
}

export const AnnounceSignalingEvent = t.object({
  type: t.literal(SignalingEventType.Announce),
  room_id: t.string(),
  sender_peer_id: t.string()
});

export const ConnectSignalingEvent = t.object({
  type: t.literal(SignalingEventType.Connect),
  room_id: t.string(),
  sender_peer_id: t.string(),

  peer_id: t.string(),
  connection_id: t.string()
});

export const CandidateSignalingEvent = t.object({
  type: t.literal(SignalingEventType.Candidate),
  peer_id: t.string(),
  connection_id: t.string(),
  candidate: t.object({
    candidate: t.string().optional(),
    sdpMLineIndex: t.number().or(t.null()).optional(),
    sdpMid: t.string().or(t.null()).optional(),
    usernameFragment: t.string().or(t.null()).optional()
  })
});

export const SDP = t.object({
  type: t.literal("offer").or(t.literal("answer")).or(t.literal("pranswer")).or(t.literal("rollback")),
  sdp: t.string().optional()
});

export const DescriptionSignalingEvent = t.object({
  type: t.literal(SignalingEventType.Description),
  peer_id: t.string(),
  connection_id: t.string(),
  description: SDP
});

export const SignalingEvent = AnnounceSignalingEvent.or(ConnectSignalingEvent)
  .or(CandidateSignalingEvent)
  .or(DescriptionSignalingEvent);
export type SignalingEvent = t.infer<typeof SignalingEvent>;

export const SignalingEventCodec = codecs.createBSONCodec((data: SignalingEvent) => {
  SignalingEvent.parse(data);
  return true;
});
