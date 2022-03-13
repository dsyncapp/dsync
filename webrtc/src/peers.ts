import * as protocols from "@dsyncapp/protocols";
export type Peer = protocols.interfaces.Peer & {};

export type CreatePeerParams = {
  id: string;
  peer_id: string;
  connection_id: string;

  ice_servers?: RTCIceServer[];
  signaling_controller: protocols.interfaces.SignalingController;

  master: boolean;
};

export const createPeer = (params: CreatePeerParams): Peer => {
  const connection = new RTCPeerConnection({
    iceServers: params.ice_servers || [{ urls: "stun:stun.l.google.com:19302" }]
  });

  connection.onicecandidateerror = (err) => {
    console.log("ice error", err);
  };

  connection.oniceconnectionstatechange = (state) => {
    console.log("ice con state change", state);
    if (connection.iceConnectionState === "failed") {
      connection.restartIce();
    }
  };

  connection.onconnectionstatechange = (s) => {
    console.log("con state change", s);
  };

  const handlerChannel = (channel: RTCDataChannel) => {
    channel.onerror = () => {
      console.log("connection failed");
    };
    channel.onopen = () => {
      console.log("connection opened");
    };
    channel.onclose = () => {
      console.log("connection clsoed");
    };
  };

  let channel: RTCDataChannel | undefined;
  if (params.master) {
    channel = connection.createDataChannel("data", {
      ordered: false
    });
    handlerChannel(channel);
  }

  let making_offer = false;
  connection.onnegotiationneeded = async () => {
    making_offer = true;
    try {
      await connection.setLocalDescription();
      params.signaling_controller.send({
        type: protocols.p2p.SignalingEventType.Description,
        connection_id: params.connection_id,
        peer_id: params.peer_id,
        description: connection.localDescription?.toJSON()
      });
    } catch (err) {
      console.error(err);
    } finally {
      making_offer = false;
    }
  };

  connection.ondatachannel = (event) => {
    channel = event.channel;

    handlerChannel(channel);
  };

  connection.onicecandidate = (event) => {
    if (!event.candidate) {
      return;
    }

    console.log("Proposing ICE candidate", event.candidate.toJSON());

    params.signaling_controller.send({
      type: protocols.p2p.SignalingEventType.Candidate,
      candidate: event.candidate.toJSON(),
      connection_id: params.connection_id,
      peer_id: params.peer_id
    });
  };

  let ignore_offer = false;
  const unsubscribe = params.signaling_controller.subscribe(async (event) => {
    if (!("connection_id" in event)) {
      return;
    }
    if (event.connection_id !== params.connection_id) {
      return;
    }

    switch (event.type) {
      case protocols.p2p.SignalingEventType.Candidate: {
        console.log(`Received new ICE candidate from ${event.peer_id}[${event.connection_id}]`, event.candidate);
        try {
          await connection.addIceCandidate(event.candidate);
        } catch (err) {
          if (!ignore_offer) {
            throw err;
          }
        }

        return;
      }
      case protocols.p2p.SignalingEventType.Description: {
        console.log(`Received description from ${event.peer_id}[${event.connection_id}]`, event.description);

        const offer_collision =
          event.description.type === "offer" && (making_offer || connection.signalingState !== "stable");

        ignore_offer = params.master && offer_collision;
        if (ignore_offer) {
          return;
        }

        await connection.setRemoteDescription(event.description);
        if (event.description.type === "offer") {
          await connection.setLocalDescription();
          params.signaling_controller.send({
            type: protocols.p2p.SignalingEventType.Description,
            connection_id: params.connection_id,
            peer_id: params.peer_id,
            description: connection.localDescription?.toJSON()
          });
        }

        return;
      }
    }
  });

  return {
    id: params.peer_id
  };
};
