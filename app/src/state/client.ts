import * as constants from "../constants";
import * as sock from "../api/socket";

export const socket =
  typeof window !== "undefined"
    ? sock.createSocketClient({
        endpoint: global.ENV.API_ENDPOINT,
        socket_id: constants.process_id
      })
    : (undefined as unknown as ReturnType<typeof sock.createSocketClient>);
