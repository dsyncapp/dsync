import * as electron from "electron";

electron.app.on("ready", () => {
  const win = new electron.BrowserWindow({
    webPreferences: {
      webviewTag: true,
      nodeIntegrationInSubFrames: true,
      nodeIntegration: true
    }
  });

  win.loadURL("http://localhost:3000");
  // win.loadFile("../../app/out/index.html");
});
