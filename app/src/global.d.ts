declare var ENV: {
  API_ENDPOINT: string;
  WEBVIEW_PRELOAD_FILE: string;
};

declare var ExtensionIPC: {
  send: (data: import("@dsyncapp/protocols").extension_ipc.ExtensionIPCEvent) => void;
  subscribe: (listener: (event: import("@dsyncapp/protocols").extension_ipc.ExtensionIPCEvent) => void) => () => void;
};

