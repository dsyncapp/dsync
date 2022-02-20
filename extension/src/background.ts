import * as protocols from "@dsyncapp/protocols";
import * as browser from "webextension-polyfill";

type ActiveTab = {
  tab: browser.Tabs.Tab;
  port?: browser.Runtime.Port;
};

let active_tab: ActiveTab | undefined;

browser.tabs.onRemoved.addListener((tab_id, info) => {
  if (tab_id === active_tab?.tab.id) {
    active_tab.port?.disconnect();
    active_tab = undefined;

    console.log("Active tab closed");
  }
});

browser.tabs.onUpdated.addListener((tab_id, info) => {
  if (tab_id === active_tab?.tab.id) {
    if (info.status === "loading" && info.url) {
      console.log("Active tab navigated", info.url);
    }
  }
});

const socket = protocols.createSocketClient({
  endpoint: "ws://localhost:52543",
  codec: protocols.extension_ipc.ExtensionIPCCodec
});

const createTab = (url: string) => {
  return new Promise<browser.Tabs.Tab>(async (resolve) => {
    const tab = await browser.tabs.create(
      {
        active: true,
        url: url
      },
      // @ts-ignore
      (tab) => {
        resolve(tab);
      }
    );
    if (tab) {
      resolve(tab);
    }
  });
};

socket.subscribe(async (event) => {
  switch (event.type) {
    case "set-source": {
      if (!active_tab) {
        const tab = await createTab(event.source);

        await browser.tabs.executeScript(tab.id, {
          allFrames: true,
          file: "/dist/polyfill.js"
        });

        await browser.tabs.executeScript(tab.id, {
          allFrames: true,
          file: "/dist/content.js"
        });

        active_tab = {
          tab
        };
      }

      if (active_tab.tab.url === event.source) {
        return;
      }

      await browser.tabs.update(active_tab.tab.id!, {
        url: event.source
      });
      return;
    }
    default: {
      return active_tab?.port?.postMessage(event);
    }
  }
});

browser.runtime.onConnect.addListener((port) => {
  if (active_tab) {
    active_tab.port = port;
  }

  port.onMessage.addListener((event) => {
    console.log("Received IPC event", event);
    socket.send(event);
  });
});
