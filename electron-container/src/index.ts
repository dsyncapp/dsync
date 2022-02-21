import * as protocols from "@dsyncapp/protocols";
import * as electron from "electron";
import * as dotenv from "dotenv";
import * as uuid from "uuid";
import * as path from "path";
import * as _ from "lodash";
import * as URL from "url";
import * as ws from "ws";

dotenv.config();

const windows: electron.BrowserWindow[] = [];

export const sendToWindows = (channel: string, data: any) => {
  windows.forEach((window) => {
    window.webContents.send(channel, data);
  });
};

const extension_server = new ws.WebSocketServer({
  port: 52543
});

const extensions = new Map<string, ws.WebSocket>();

extension_server.on("connection", (socket) => {
  console.log("Extension connected");
  const id = uuid.v4();

  extensions.set(id, socket);

  if (extensions.size === 1) {
    sendToWindows("extension-status", {
      status: "connected"
    });
  }

  socket.on("message", (message) => {
    if (Array.isArray(message)) {
      return;
    }
    const event = protocols.extension_ipc.Codec.decode(Buffer.from(message));
    console.log("Received event from extension", event.type);
    windows.forEach((window) => {
      window.webContents.send("extension-ipc", event);
    });
  });

  socket.on("close", () => {
    console.log("Extension disconnected");
    extensions.delete(id);

    if (extensions.size === 0) {
      sendToWindows("extension-status", {
        status: "disconnected"
      });
    }
  });
});

extension_server.on("error", (err) => {
  console.log(err);
});

extension_server.on("listening", () => {
  console.log(`listening on port 52543`);
});

electron.ipcMain.on("extension-ipc", (_, data) => {
  for (const extension of extensions.values()) {
    extension.send(Buffer.from(protocols.extension_ipc.Codec.encode(data)));
  }
});

electron.ipcMain.on("extension-status", () => {
  const extensions_found = extensions.size > 0;
  sendToWindows("extension-status", {
    status: extensions_found ? "connected" : "disconnected"
  });
});

const loadURL = (url: string) => {
  const win = new electron.BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, "./window-preload.js"),
      webviewTag: true,
      nodeIntegrationInSubFrames: true,
      nodeIntegration: true
    }
  });

  win.loadURL(url);
  windows.push(win);

  return win;
};

electron.app.on("ready", async () => {
  if (!electron.app.isPackaged) {
    for (const _i of _.range(Number(process.env.NUM_WINDOWS || "1"))) {
      const window = loadURL("http://localhost:3000");
      if (process.env.OPEN_DEVTOOLS === "true") {
        window.webContents.openDevTools();
      }
    }
  } else {
    electron.protocol.interceptFileProtocol("file", (request, callback) => {
      const url = request.url.substring(8);
      callback({ path: path.resolve(__dirname, "out", url) });
    });
    loadURL(
      URL.format({
        pathname: path.join("index.html"),
        protocol: "file:",
        slashes: true
      })
    );
  }
});
