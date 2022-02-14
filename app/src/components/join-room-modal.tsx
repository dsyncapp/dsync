import * as Next from "@nextui-org/react";
import * as React from "react";

type Props = Omit<Partial<Next.ModalProps>, "blur"> & {
  onJoin: (room_id: string) => void;
};

export const JoinRoomModal: React.FC<Props> = (props) => {
  const [room_id, setRoomId] = React.useState("");

  return (
    <Next.Modal blur {...props}>
      <Next.Modal.Header>
        <p>Join New Room</p>
      </Next.Modal.Header>

      <Next.Modal.Body style={{ alignItems: "center" }}>
        <p>Enter Room ID to start watching together</p>

        <Next.Input
          animated={false}
          status="primary"
          autoFocus
          labelLeft="Room ID"
          fullWidth
          onChange={(e) => setRoomId(e.target.value)}
          value={room_id}
          onKeyPress={(e) => {
            if (e.code === "Enter") {
              if (room_id) {
                props.onJoin(room_id);
              }
            }
          }}
        />
      </Next.Modal.Body>

      <Next.Modal.Footer justify="center">
        <Next.Button flat bordered color="secondary" onClick={() => props.onJoin(room_id)}>
          JOIN!
        </Next.Button>
      </Next.Modal.Footer>
    </Next.Modal>
  );
};

export default JoinRoomModal;
