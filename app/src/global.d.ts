declare var ENV: {
  API_ENDPOINT: string;
  WEBVIEW_PRELOAD_FILE: string;
};

declare var ExtensionIPC: {
  send: (data: import("@dsyncapp/protocols").extension_ipc.Event) => void;
  subscribe: (listener: (event: import("@dsyncapp/protocols").extension_ipc.Event) => void) => () => void;

  getStatus: () => void;
  subscribeToStatus: (listener: (status: "connected" | "disconnected") => void) => () => void;
};
