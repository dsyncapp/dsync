import * as electron from "electron";
import * as path from "path";
import * as URL from "url";

const loadURL = (url: string) => {
  const win = new electron.BrowserWindow({
    webPreferences: {
      contextIsolation: false,
      preload: path.join(__dirname, "./env-preload.js"),
      webviewTag: true,
      nodeIntegrationInSubFrames: true,
      nodeIntegration: true
    }
  });

  win.loadURL(url);
};

electron.app.on("ready", async () => {
  if (!electron.app.isPackaged) {
    loadURL("http://localhost:3000");
    loadURL("http://localhost:3000");
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
