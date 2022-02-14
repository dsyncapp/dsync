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
