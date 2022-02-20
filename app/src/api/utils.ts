import * as room_state from "./room-state";
import * as date from "date-fns";
import * as _ from "lodash";

export const filterActivePeers = (peers: Record<string, room_state.Peer>) => {
  return Object.values(peers).filter((peer) => {
    if (!peer.ts) {
      return false;
    }
    const last_ts = new Date(peer.ts);
    if (Math.abs(date.differenceInSeconds(new Date(), last_ts)) > 5) {
      return false;
    }
    return true;
  });
};

export const peerIsReady = (peer: room_state.Peer) => {
  if (peer.status?.seeking) {
    return false;
  }

  if (peer.status?.time === -1) {
    return false;
  }

  return true;
};

export const allPeersReady = (peers: Record<string, room_state.Peer>) => {
  return filterActivePeers(peers).reduce((ready, peer) => {
    if (!ready) {
      return false;
    }
    return peerIsReady(peer);
  }, true);
};

export const getDeltaFromFurthestPeer = (peers: Record<string, room_state.Peer>, peer: room_state.Peer) => {
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
