import * as constants from "../constants"
import * as sock from "../api/socket";

export const socket = sock.createSocketClient({
  endpoint: constants.ENDPOINT,
  client_id: constants.client_id,
  socket_id: constants.process_id
});
