import * as electron from "electron";
import * as dotenv from "dotenv";
import * as path from "path";
import * as _ from "lodash";
import * as URL from "url";

dotenv.config();

const windows: electron.BrowserWindow[] = [];

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
