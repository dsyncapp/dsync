import * as protocols from "@dsyncapp/protocols";
import * as electron from "electron";
import * as uuid from "uuid";
import * as path from "path";
import * as URL from "url";
import * as ws from "ws";

const windows: electron.BrowserWindow[] = [];

const extension_server = new ws.WebSocketServer({
  port: 52543
});

const extensions = new Map<string, ws.WebSocket>();

extension_server.on("connection", (socket) => {
  console.log("Extension connected");
  const id = uuid.v4();

  extensions.set(id, socket);

  socket.on("message", (message) => {
    if (Array.isArray(message)) {
      return;
    }
    const event = protocols.extension_ipc.ExtensionIPCCodec.decode(Buffer.from(message));
    console.log("Received event from extension", event.type);
    windows.forEach((window) => {
      window.webContents.send("extension-ipc", event);
    });
  });

  socket.on("close", () => {
    console.log("Extension disconnected");
    extensions.delete(id);
  });
});

extension_server.on("error", (err) => {
  console.log(err);
});

extension_server.on("listening", () => {
  console.log(`listening on port 52543`);
});

electron.ipcMain.on("extension-ipc", (event, data) => {
  for (const extension of extensions.values()) {
    extension.send(Buffer.from(protocols.extension_ipc.ExtensionIPCCodec.encode(data)));
  }
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
    const win1 = loadURL("http://localhost:3000");
    const win2 = loadURL("http://localhost:3000");
    win1.webContents.openDevTools();
    win2.webContents.openDevTools();
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
