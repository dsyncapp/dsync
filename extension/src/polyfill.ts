import "webextension-polyfill";
import * as B from "buffer/";

window.Buffer = B.Buffer as any;
