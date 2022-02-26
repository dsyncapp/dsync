import * as protocols from "@dsyncapp/protocols";
import * as browser from "webextension-polyfill";

type ActiveTab = {
  reference_id: string;
  id: number;
  tab: browser.Tabs.Tab;
  ports: Map<string, browser.Runtime.Port>;
};

const tabs = new Map<string, ActiveTab>();

const socket = protocols.ws.createSocketClient({
  endpoint: "ws://localhost:52543",
  codec: protocols.extension_ipc.Codec,
  onDisconnect: () => {
    tabs.forEach((tab) => {
      browser.tabs.remove(tab.id);
    });
    tabs.clear();
  }
});

const injectContentScripts = async (tab_id: number) => {
  await browser.tabs.executeScript(tab_id, {
    allFrames: true,
    file: "/dist/polyfill.js"
  });

  await browser.tabs.executeScript(tab_id, {
    allFrames: true,
    file: "/dist/content.js"
  });
};

browser.tabs.onRemoved.addListener((tab_id) => {
  for (const tab of tabs.values()) {
    if (tab.id === tab_id) {
      console.log(`tab ${tab.reference_id}[${tab.id}] closed`);

      socket.send({
        type: "tab-closed",
        reference_id: tab.reference_id
      });
      tabs.delete(tab.reference_id);
    }
  }
});

browser.tabs.onUpdated.addListener((tab_id, info) => {
  for (const tab of tabs.values()) {
    if (tab.id === tab_id) {
      if (info.status === "loading") {
        injectContentScripts(tab.id);

        if (info.url) {
          console.log(`tab ${tab.reference_id}[${tab.id}] navigated`, info.url);

          socket.send({
            type: "upsert-tab",
            reference_id: tab.reference_id,
            url: info.url
          });
        }
      }
    }
  }
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
  }).then(async (tab) => {
    await injectContentScripts(tab.id!);
    return tab;
  });
};

socket.subscribe(async (event) => {
  switch (event.type) {
    case "upsert-tab": {
      let tab = tabs.get(event.reference_id);
      if (!tab) {
        const new_tab = await createTab(event.url);
        tab = {
          tab: new_tab,
          id: new_tab.id!,
          ports: new Map(),
          reference_id: event.reference_id
        };

        tabs.set(event.reference_id, tab);
      }

      if (tab.tab.url === event.url) {
        return;
      }

      await browser.tabs.update(tab.id, {
        url: event.url
      });
      return;
    }

    case "close-tab": {
      const tab = tabs.get(event.reference_id);
      if (!tab) {
        return;
      }

      await browser.tabs.remove(tab.id);
      tabs.delete(event.reference_id);

      return;
    }

    case "seek":
    case "pause":
    case "play":
    case "get-state": {
      const tab = tabs.get(event.reference_id);
      if (!tab) {
        return;
      }

      const port = tab.ports.get(event.player_id);
      if (!port) {
        return;
      }

      return port.postMessage(event);
    }
  }
});

browser.runtime.onConnect.addListener((port) => {
  for (const tab of tabs.values()) {
    if (tab.id !== port.sender?.tab?.id) {
      continue;
    }

    console.log(`Port ${port.name} registered on tab ${tab.reference_id}`);
    tab.ports.set(port.name, port);

    socket.send({
      type: "player-registered",
      player_id: port.name,
      reference_id: tab.reference_id
    });

    port.onDisconnect.addListener(() => {
      console.log(`Port ${port.name} on tab ${tab.reference_id} disconnected`);

      tab.ports.delete(port.name);

      socket.send({
        type: "player-deregistered",
        player_id: port.name,
        reference_id: tab.reference_id
      });
    });

    port.onMessage.addListener((event: protocols.ipc.IPCEvent) => {
      console.log("Received IPC event", event);

      socket.send({
        ...event,
        reference_id: tab.reference_id,
        player_id: port.name
      });
    });
  }
});
