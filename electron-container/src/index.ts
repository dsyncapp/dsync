import * as electron from "electron";

electron.app.on("ready", () => {
  const win = new electron.BrowserWindow();

  // win.loadURL("http://localhost:3000")
  win.loadFile("../../app/out/index.html");
});
