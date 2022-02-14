import * as path from "path";
import * as fs from "fs";

const dynamic_env = JSON.parse(fs.readFileSync(path.join(__dirname, "../env.json"), "utf8"));
(global as any).ENV = {
  ...dynamic_env,
  WEBVIEW_PRELOAD_FILE: `file://${path.join(__dirname, "webview-ipc-preload.js")}`
};
