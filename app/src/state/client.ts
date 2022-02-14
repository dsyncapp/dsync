import * as constants from "../constants";
import * as sock from "../api/socket";

export const socket =
  typeof window !== "undefined"
    ? sock.createSocketClient({
        endpoint: constants.ENV.API_ENDPOINT,
        client_id: constants.client_id,
        socket_id: constants.process_id
      })
    : (undefined as unknown as ReturnType<typeof sock.createSocketClient>) ;
