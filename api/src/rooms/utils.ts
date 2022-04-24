import * as defs from "./definitions";
import * as date from "date-fns";
import * as _ from "lodash";
import * as y from "yjs";

export const filterActivePeers = (peers: Record<string, defs.Peer>) => {
  return Object.values(peers).filter((peer) => {
    if (!peer.updated_at) {
      return false;
    }
    const last_ts = new Date(peer.updated_at);
    if (Math.abs(date.differenceInSeconds(new Date(), last_ts)) > 5) {
      return false;
    }
    return true;
  });
};

export const peerIsReady = (state: defs.PlayerState, peer: defs.Peer) => {
  if (peer.status?.seeking) {
    return false;
  }

  if (peer.status?.time === -1) {
    return false;
  }

  if (peer.start_time !== state.time) {
    return false;
  }

  return true;
};

export const allPeersReady = (state: defs.PlayerState, peers: Record<string, defs.Peer>) => {
  return filterActivePeers(peers).reduce((ready, peer) => {
    if (!ready) {
      return false;
    }
    return peerIsReady(state, peer);
  }, true);
};

export const getDeltaFromFurthestPeer = (peers: Record<string, defs.Peer>, peer: defs.Peer) => {
  const active_peers = filterActivePeers(peers);

  const [furthest] = _.sortBy(active_peers, (peer) => peer.status.time);
  if (!furthest || furthest.id === peer.id) {
    return;
  }

  return {
    peer: furthest,
    diff: peer.status.time - furthest.status.time
  };
};

export const stateVectorsAreEqual = (left: Uint8Array, right: Uint8Array): boolean => {
  const left_vector = y.decodeStateVector(left);
  const right_vector = y.decodeStateVector(right);

  if (left_vector.size !== right_vector.size) {
    return false;
  }

  for (const [key, value] of left_vector) {
    if (right_vector.get(key) !== value) {
      return false;
    }
  }

  return true;
};
