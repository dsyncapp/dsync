import * as t from "zod";

const buffer = t
  .any()
  .refine((t) => Buffer.isBuffer(t))
  .transform((t) => t as Buffer);

export enum PeerEventType {
  Patch = "patch",
  Sync = "sync"
}

export const PatchEvent = t.object({
  type: t.literal(PeerEventType.Patch),
  patch: buffer.optional(),
  vector: buffer.optional()
});

export const SyncEvent = t.object({
  type: t.literal(PeerEventType.Sync)
});

export const PeerEvent = PatchEvent.or(SyncEvent);
export type PeerEvent = t.infer<typeof PeerEvent>;
