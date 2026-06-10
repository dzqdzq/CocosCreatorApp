Object.defineProperty(exports, "__esModule", { value: true });
require("editor/preload").init();
window.Editor = require("editor");

const { ipcSend } = require("./ipc");

ipcSend("asset-worker:startup");
const ipc_2 = require("./ipc");
const operation_1 = require("./messages/operation");
const query_1 = require("./messages/query");
const database_1 = require("./messages/database");

const allMessageMap = {
  ...database_1.MessageMap,
  ...query_1.MessageMap,
  ...operation_1.MessageMap,
};

Object.keys(allMessageMap).forEach((a) => {
  (0, ipc_2.ipcAddListener)("asset-worker:" + a, async (...e) =>
    allMessageMap[a](...e)
  );
});

(0, ipc_2.ipcAddListener)(
  "asset-worker:batch-message-handler",
  async (a, e = false) => {
    if (e) {
      return Promise.all(a.map((e) => allMessageMap[e.name](...e.args)));
    }
    var s = [];
    for (let e = 0; e < a.length; e++) {
      var r = a[e];
      s.push(await allMessageMap[r.name](...r.args));
    }
    return s;
  }
);
