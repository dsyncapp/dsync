import * as uuid from "uuid";

export type ENV = {
  API_ENDPOINT: string;
  WEBVIEW_PRELOAD_FILE: string;
};
export const ENV: ENV = (global as any).ENV;

export let client_id: string;

const stored_client_id = global?.localStorage?.getItem("client-id");
if (stored_client_id) {
  client_id = stored_client_id;
} else {
  client_id = uuid.v4();
  global?.localStorage?.setItem("client-id", client_id);
}

export const process_id = uuid.v4();
