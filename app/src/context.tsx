import { API, ApplicationState } from "./api";
import * as client from "./client";
import * as React from "react";
import * as uuid from "uuid";

const ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT || "localhost:9987";

let client_id = localStorage.getItem("client-id");
if (!client_id) {
  client_id = uuid.v4();
  localStorage.setItem("client-id", client_id);
}

const sock = new client.SocketClient(ENDPOINT, client_id);
export const api = new API(sock);

export const StateContext = React.createContext<[ApplicationState, API]>([
  {
    rooms: []
  },
  api
]);
