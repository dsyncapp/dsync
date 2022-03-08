import * as Next from "@nextui-org/react";
import * as React from "react";

type Props = Omit<Partial<Next.ModalProps>, "blur"> & {
  onCreate: (name: string) => void;
};

export const CreateRoomModal: React.FC<Props> = (props) => {
  const [room_name, setRoomName] = React.useState("");

  return (
    <Next.Modal blur {...props}>
      <Next.Modal.Header>
        <p>Create a New Room</p>
      </Next.Modal.Header>

      <Next.Modal.Body style={{ alignItems: "center" }}>
        <p>Give your room a name!</p>

        <Next.Input
          animated={false}
          status="primary"
          autoFocus
          labelLeft="Name"
          fullWidth
          onChange={(e) => setRoomName(e.target.value)}
          value={room_name}
          onKeyPress={(e) => {
            if (e.code === "Enter") {
              if (room_name) {
                props.onCreate(room_name);
              }
            }
          }}
        />
      </Next.Modal.Body>

      <Next.Modal.Footer justify="center">
        <Next.Button disabled={!room_name} flat bordered color="secondary" onClick={() => props.onCreate(room_name)}>
          CREATE!
        </Next.Button>
      </Next.Modal.Footer>
    </Next.Modal>
  );
};

export default CreateRoomModal;
