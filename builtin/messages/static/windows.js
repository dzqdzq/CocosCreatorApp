let global_Editor = global.Editor;
global_Editor = global_Editor || require("editor");
const requestQueue = [];
let id = 1;
const methods = {
  request(e) {
    var s;

    if (e.name !== "messages") {
      s = new Error("message").stack.match(/\(.*\)/g);

      s = {
        process: "renderer",
        type: "request",
        name: e.name,
        message: e.message,
        source: s[4],
        timestamp: Date.now(),
        time: 0,
        args: e.args,
        id: id++,
      };

      e.id = s.id;
      requestQueue.push(s);
      global_Editor.Message.send("messages", "request", s);
    }
  },
  reply(r) {
    var e;
    var s;

    if (r.name !== "messages") {
      s = new Error("message").stack.match(/\(.*\)/g);

      e = requestQueue.find((e, s) => {
        if (e.id === r.id) {
          requestQueue.splice(s, 1);
          return true;
        }
      });

      s = {
        process: "renderer",
        type: "reply",
        name: r.name,
        message: r.message,
        source: s[3],
        timestamp: Date.now(),
        time: e ? Date.now() - e.timestamp : -1,
        args: r.args,
        id: e ? e.id : "",
      };

      global_Editor.Message.send("messages", "reply", s);
    }
  },
  send(e) {
    var s;

    if (e.name !== "messages") {
      s = new Error("message").stack.match(/\(.*\)/g);

      s = {
        process: "renderer",
        type: "send",
        name: e.name,
        message: e.message,
        source: s[4],
        timestamp: Date.now(),
        time: 0,
        args: e.args,
        id: 0,
      };

      global_Editor.Message.send("messages", "send", s);
    }
  },
  broadcast(e) {
    var s;

    if (e.name !== "messages") {
      s = new Error("message").stack.match(/\(.*\)/g);

      s = {
        process: "renderer",
        type: "broadcast",
        name: e.name,
        message: e.message,
        source: s[4],
        timestamp: Date.now(),
        time: 0,
        args: e.args,
        id: 0,
      };

      global_Editor.Message.send("messages", "broadcast", s);
    }
  },
  addListener() {
    var e = require("@electron/remote").getGlobal("Editor");
    e.remote.Message.__eb__.on("request", methods.request);
    e.remote.Message.__eb__.on("reply", methods.reply);
    e.remote.Message.__eb__.on("send", methods.send);
    e.remote.Message.__eb__.on("broadcast", methods.broadcast);
  },
  removeListener() {
    var e = require("@electron/remote").getGlobal("Editor");
    e.remote.Message.__eb__.removeListener("request", methods.request);
    e.remote.Message.__eb__.removeListener("reply", methods.reply);
    e.remote.Message.__eb__.removeListener("send", methods.send);
    e.remote.Message.__eb__.removeListener("broadcast", methods.broadcast);
  },
};

exports.load = () => {
  global_Editor.Message.addBroadcastListener(
    "messages:start",
    methods.addListener
  );

  global_Editor.Message.addBroadcastListener(
    "messages:stop",
    methods.removeListener
  );
};

exports.unload = () => {
  global_Editor.Message.removeBroadcastListener(
    "messages:start",
    methods.addListener
  );

  global_Editor.Message.removeBroadcastListener(
    "messages:stop",
    methods.removeListener
  );
};
