import * as uuid from "uuid";

export let client_id: string;

const stored_client_id = localStorage.getItem("client-id");
if (stored_client_id) {
  client_id = stored_client_id;
} else {
  client_id = uuid.v4();
  localStorage.setItem("client-id", client_id);
}

export const process_id = uuid.v4();
export const ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT || "localhost:9987";
