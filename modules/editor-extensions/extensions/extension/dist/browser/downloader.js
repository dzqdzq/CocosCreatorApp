Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadList = undefined;
exports.init = init;
exports.generateDownloadItem = generateDownloadItem;
exports.pushDownloadList = pushDownloadList;
exports.removeDownloadItem = removeDownloadItem;
exports.removeDownloadList = removeDownloadList;
exports.getDownloadInfo = getDownloadInfo;
exports.onItemUpdate = onItemUpdate;

const { remove } = require("fs-extra");

const { join } = require("path");

const DOWNLOAD_PATH = join(Editor.App.home, "download");
async function init() {
  (await Editor.Profile.getConfig("extension", "download-list")).forEach(
    (o) => {
      if (o.downloadProgress < 1) {
        o.downloadProgress = -1;
      }

      if (o.installProgress < 1) {
        o.installProgress = -1;
      }

      exports.downloadList.push(o);
    }
  );
}
function generateDownloadItem(o) {
  var e = join(DOWNLOAD_PATH, o.production_id + "-" + o.version_id + ".zip");
  return {
    version_id: o.version_id,
    production_id: o.production_id,
    name: o.name,
    name_en: o.name_en,
    type: o.type_id,
    file: e,
    url: o.download_url,
    downloadProgress: 0,
    installProgress: 0,
    date: Date.now(),
    dependency: o.dependency,
  };
}
function pushDownloadList(o) {
  exports.downloadList.push(o);
  Editor.Message.broadcast("extension:downloader-update");

  Editor.Profile.setConfig(
    "extension",
    "download-list",
    exports.downloadList,
    "global"
  );
}
async function removeDownloadItem(e, t) {
  for (let o = 0; o < exports.downloadList.length; o++) {
    var n = exports.downloadList[o];
    if (n.version_id === e && n.production_id === t) {
      await remove(n.file);
      exports.downloadList.splice(o, 1);
      Editor.Message.broadcast("extension:downloader-update");

      Editor.Profile.setConfig(
        "extension",
        "download-list",
        exports.downloadList,
        "global"
      );

      return true;
    }
  }
  return false;
}
async function removeDownloadList() {
  await Promise.all(
    exports.downloadList.map(async (o) => {
      await remove(o.file);
    })
  );

  exports.downloadList.splice(0, exports.downloadList.length);
  Editor.Message.broadcast("extension:downloader-update");

  Editor.Profile.setConfig(
    "extension",
    "download-list",
    exports.downloadList,
    "global"
  );
}
function getDownloadInfo(e, t) {
  for (let o = 0; o < exports.downloadList.length; o++) {
    var n = exports.downloadList[o];
    if (n.version_id === e && n.production_id === t) {
      return n;
    }
  }
  return null;
}
function onItemUpdate(o) {
  Editor.Message.broadcast("extension:downloader-update", o);

  Editor.Profile.setConfig(
    "extension",
    "download-list",
    exports.downloadList,
    "global"
  );
}
exports.downloadList = [];
