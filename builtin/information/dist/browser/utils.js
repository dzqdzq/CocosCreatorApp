Object.defineProperty(exports, "__esModule", { value: true });
exports.networkDialogMap = undefined;
exports.dialogMap = undefined;
exports.isExpired = isExpired;
exports.checkInternetConnection = checkInternetConnection;
exports.updateCachedFormInfos = updateCachedFormInfos;
exports.handleNetworkStatus = handleNetworkStatus;
exports.queryInfo = queryInfo;
exports.openDialog = openDialog;
const electron_1 = require("electron");

const { stringify } = require("querystring");

const { join } = require("path");

const { pathToFileURL } = require("url");

exports.dialogMap = {};
exports.networkDialogMap = {};
const default_cache_time = 86400000; /* 864e5 */
async function isExpired(e) {
  var o =
    (await Editor.Profile.getConfig("utils", "information.cache_time")) ||
    default_cache_time;
  return Date.now() - e > o;
}
async function checkInternetConnection() {
  return Editor.Network.__protected__.testConnectServer();
}
async function updateCachedFormInfos(e) {
  if (e) {
    var o =
      (await Editor.Profile.getProject("information", "information")) || {};
    for (const r in o) {
      var t = o[r];

      if (t.id === e.id) {
        t[t.id].complete = e[e.id].complete;
        await Editor.Profile.setProject("information", "information." + r, t);
      }
    }
  }
}
async function handleNetworkStatus(e, o) {
  var t;
  var o = (e.data && e.data.id) || o;

  if (
    o &&
    exports.networkDialogMap[o] &&
    exports.networkDialogMap[o].length > 0
  ) {
    return { action: "reject" };
  }

  if (e.status === "network_failure") {
    t = Date.now();

    await openNetworkDialog(
      pathToFileURL(
        join(__dirname, "../../static/network-failure.html")
      ).toString(),
      "network_failure",
      o
    );

    return 10 < (Date.now() - t) / 1000 /* 1e3 */
      ? { action: "resolve" }
      : { action: "reject" };
  }

  if (e.status === "network_exception") {
    await openNetworkDialog(
      pathToFileURL(
        join(__dirname, "../../static/network-exception.html")
      ).toString(),
      "network_exception",
      o
    );

    return { action: "reject" };
  }

  return { action: "resolve" };
}
async function queryInfo(e) {
  try {
    var o = await Editor.Profile.getConfig("utils", "information.url");

    var t = {
      form: e || "",
      uid: (await Editor.User.getData()).cocos_uid,
      pid: Editor.Project.uuid,
      ver: Editor.App.version,
      lang: Editor.I18n.getLanguage(),
    };

    var r = await Editor.Network.get(o, t);
    return JSON.parse(r.toString());
  } catch (e) {
    console.debug("[information] Query information:", e);
    return null;
  }
}
async function openDialog(e, o, t = "") {
  var r = await Editor.User.getData();
  o = o || {};
  o.uid = r.cocos_uid;
  o.pid = Editor.Project.uuid;
  o.ver = Editor.App.version;
  o.lang = Editor.I18n.getLanguage();
  const i = electron_1.BrowserWindow.getFocusedWindow();
  const n = new electron_1.BrowserWindow({ autoHideMenuBar: true });

  if (i && n !== i && !i.isDestroyed()) {
    n.webContents.on("dom-ready", () => {
      if (!n.isDestroyed() && i) {
        n.setParentWindow(i);
      }
    });
  }

  let a = e;

  if (/\?/.test(e)) {
    a += "&" + stringify(o || {});
  } else {
    a += "?" + stringify(o || {});
  }

  n.loadURL(a);

  if (t) {
    if (exports.dialogMap[t]) {
      exports.dialogMap[t].push(n.id);
    } else {
      exports.dialogMap[t] = [n.id];
    }
  }

  return new Promise((o) => {
    n.on("closed", () => {
      var e;

      if (
        exports.dialogMap[t] &&
        exports.dialogMap[t].length &&
        -1 !== (e = exports.dialogMap[t].indexOf(n.id))
      ) {
        exports.dialogMap[t].splice(e, 1);
      }

      o(undefined);
    });
  });
}
function openNetworkDialog(e, o, t = "") {
  const r = electron_1.BrowserWindow.getFocusedWindow();
  const i = new electron_1.BrowserWindow({ autoHideMenuBar: true });

  if (r && i !== r && !r.isDestroyed()) {
    i.webContents.on("dom-ready", () => {
      if (!i.isDestroyed() && r) {
        i.setParentWindow(r);
      }
    });
  }

  i.loadURL(e);
  const n = t || o;

  if (!exports.networkDialogMap[n]) {
    exports.networkDialogMap[n] = [];
  }

  exports.networkDialogMap[n].push(i.id);

  return new Promise((t) => {
    i.on("closed", () => {
      var e;
      var o = exports.networkDialogMap[n];

      if (o && o.length && -1 !== (e = o.indexOf(i.id))) {
        o.splice(e, 1);
      }

      t(undefined);
    });
  });
}
