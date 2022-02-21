import * as protocols from "@dsyncapp/protocols";
import * as electron from "electron";
import * as path from "path";
import * as fs from "fs";

const dynamic_env = JSON.parse(fs.readFileSync(path.join(__dirname, "../env.json"), "utf8"));

electron.contextBridge.exposeInMainWorld("ENV", {
  ...dynamic_env,
  WEBVIEW_PRELOAD_FILE: `file://${path.join(__dirname, "webview-ipc-preload.js")}`
});

electron.contextBridge.exposeInMainWorld("ExtensionIPC", {
  send: (data: protocols.extension_ipc.Event) => {
    electron.ipcRenderer.send("extension-ipc", data);
  },
  subscribe: (listener: (event: protocols.extension_ipc.Event) => void) => {
    const handler = (_: electron.IpcRendererEvent, data: any) => {
      listener(data);
    };
    electron.ipcRenderer.on("extension-ipc", handler);
    return () => {
      electron.ipcRenderer.off("extension-ipc", handler);
    };
  },

  getStatus: () => {
    electron.ipcRenderer.send("extension-status");
  },
  subscribeToStatus: (listener: (status: string) => void) => {
    const handler = (_: electron.IpcRendererEvent, data: any) => {
      listener(data.status);
    };
    electron.ipcRenderer.on("extension-status", handler);
    return () => {
      electron.ipcRenderer.off("extension-status", handler);
    };
  }
});
