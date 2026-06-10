Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.load = load;
exports.unload = unload;

const { appendMessage, saveMessageLog } = require("./record-message");

const requestQueue = [];
let id = 0;
let hasRecord = false;
let autoSave = false;
async function load() {
  Editor.Package.getPackages().forEach(exports.methods.attach);

  Editor.Package.__protected__.on("enable", (e) => {
    exports.methods.attach(e);
  });

  Editor.Package.__protected__.on("disable", exports.methods.detach);

  if (Editor.App.args.recordMessage) {
    await exports.methods.startAutoSave();
    exports.methods.addListener();
  }
}
function unload() {
  Editor.Package.__protected__.removeListener("enable", exports.methods.attach);

  Editor.Package.__protected__.removeListener(
    "disable",
    exports.methods.detach
  );

  exports.methods.removeListener();
}
exports.methods = {
  request(e) {
    var s;

    if (
      e.name !== "messages" &&
      ((s = new Error("message").stack.match(/\(.*\)/g) || []),
      (s = {
        process: "browser",
        type: "request",
        name: e.name,
        message: e.message,
        source: s[4],
        timestamp: Date.now(),
        time: 0,
        args: e.args,
        id: id++,
      }),
      (e.id = s.id),
      requestQueue.push(s),
      Editor.Message.send("messages", "request", s),
      autoSave)
    ) {
      appendMessage(s);
    }
  },
  reply(a) {
    var e;
    var s;

    if (
      a.name !== "messages" &&
      ((s = new Error("message").stack.match(/\(.*\)/g) || []),
      (e = requestQueue.find((e, s) => {
        if (e.id === a.id) {
          requestQueue.splice(s, 1);
          return true;
        }
      })),
      (s = {
        process: "browser",
        type: "reply",
        name: a.name,
        message: a.message,
        source: s[3],
        timestamp: Date.now(),
        time: Date.now() - (e ? e.timestamp : 0),
        args: a.args,
        id: e ? e.id : 0,
      }),
      Editor.Message.send("messages", "reply", s),
      autoSave)
    ) {
      appendMessage(s);
    }
  },
  send(e) {
    var s;

    if (
      e.name !== "messages" &&
      ((s = new Error("message").stack.match(/\(.*\)/g) || []),
      (s = {
        process: "browser",
        type: "send",
        name: e.name,
        message: e.message,
        source: s[4],
        timestamp: Date.now(),
        time: 0,
        args: e.args,
        id: 0,
      }),
      Editor.Message.send("messages", "send", s),
      autoSave)
    ) {
      appendMessage(s);
    }
  },
  broadcast(e) {
    var s;

    if (
      e.name !== "messages" &&
      ((s = new Error("message").stack.match(/\(.*\)/g) || []),
      (s = {
        process: "browser",
        type: "broadcast",
        name: e.name,
        message: e.message,
        source: s[4],
        timestamp: Date.now(),
        time: 0,
        args: e.args,
        id: 0,
      }),
      Editor.Message.send("messages", "broadcast", s),
      autoSave)
    ) {
      appendMessage(s);
    }
  },
  addListener() {
    var e;

    if (!hasRecord) {
      (e = Editor.remote).Message.__protected__.__eb__.on(
        "request",
        exports.methods.request
      );

      e.Message.__protected__.__eb__.on("reply", exports.methods.reply);
      e.Message.__protected__.__eb__.on("send", exports.methods.send);
      e.Message.__protected__.__eb__.on("broadcast", exports.methods.broadcast);
      hasRecord = true;
    }
  },
  removeListener() {
    var e;

    if (hasRecord) {
      (e = Editor.remote).Message.__protected__.__eb__.removeListener(
        "request",
        exports.methods.request
      );

      e.Message.__protected__.__eb__.removeListener(
        "reply",
        exports.methods.reply
      );

      e.Message.__protected__.__eb__.removeListener(
        "send",
        exports.methods.send
      );

      e.Message.__protected__.__eb__.removeListener(
        "broadcast",
        exports.methods.broadcast
      );

      hasRecord = false;
    }
  },
  open() {
    Editor.Panel.open("messages");
  },
  openDebug() {
    Editor.Panel.open("messages.debug");
  },
  attach(e) {
    if (!e.invalid) {
      e.name;
      e.info;

      e.info.contributions &&
        e.info.contributions.messages &&
        Editor.Message.__protected__.__register__(
          e.name,
          e.info.contributions.messages
        );
    }
  },
  detach(e) {
    Editor.Message.__protected__.__unregister__(e.name);
  },
  queryMessageState() {
    return { hasRecord, autoSave };
  },
  async startAutoSave() {
    if (!autoSave) {
      await saveMessageLog();
      autoSave = true;
    }
  },
  async stopAutoSave() {
    autoSave = autoSave && false;
  },
};
