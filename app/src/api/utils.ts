import * as room_state from "./room-state";
import * as date from "date-fns";
import * as _ from "lodash";

export const filterActivePeers = (peers: Record<string, room_state.Peer>) => {
  return Object.values(peers).filter((peer) => {
    const last_heartbeat = new Date(peer.heartbeat);
    if (Math.abs(date.differenceInSeconds(new Date(), last_heartbeat)) > 5) {
      return false;
    }
    return true;
  });
};

export const allPeersReady = (peers: Record<string, room_state.Peer>) => {
  return filterActivePeers(peers).reduce((ready, peer) => {
    if (!ready) {
      return false;
    }

    if (peer.status?.seeking) {
      return false;
    }

    return true;
  }, true);
};

export const getDeltaFromFurthestPeer = (peers: Record<string, room_state.Peer>, id: string) => {
  const reference = peers[id];
  if (!reference) {
    return;
  }

  const active_peers = filterActivePeers(peers);

  const [furthest] = _.sortBy(active_peers, (peer) => peer.status.time);
  if (!furthest) {
    return {
      left_time: reference,
      right_time: reference,
      delta: 0
    };
  }

  return {
    left: furthest,
    right: reference,
    delta: reference.status.time - furthest.status.time
  };
};
