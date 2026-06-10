Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultDownloadTypeInfoMap = undefined;
exports.register = register;
exports.unregister = unregister;
exports.getInfoFromTypeID = getInfoFromTypeID;
exports.getExtensionInfoMap = getExtensionInfoMap;

const { join } = require("path");

const { v4 } = require("uuid");

const downloadTypeInfoMap = {};
const createExtensionInfoMap = {};
function register(e, a, o) {
  if (o.download) {
    downloadTypeInfoMap[e] = o.download.map((e) => ({
      id: e.id,
      name: e.name,
      module: join(a, e.module),
      check: e.check,
      download: e.download,
      install: e.install,
    }));
  }

  if (
    o.template &&
    (o = o.template.map((e) => {
      var o = join(a, e.path);
      var n = e.description || "unknown";
      var t = e.creator && join(a, e.creator);
      return {
        ...e,
        id: v4(),
        rawPath: e.path,
        path: o,
        description: n,
        creator: t,
      };
    })).length > 0
  ) {
    createExtensionInfoMap[e] ??= {};
    createExtensionInfoMap[e].templates = o;
  }
}
function unregister(e) {
  delete createExtensionInfoMap[e];
  delete downloadTypeInfoMap[e];
}
function getInfoFromTypeID(o) {
  var n = [exports.defaultDownloadTypeInfoMap];
  for (const e in downloadTypeInfoMap) {
    var t = downloadTypeInfoMap[e];
    if (t) {
      for (let e = 0; e < t.length; e++) {
        var a = t[e];

        if (a.id == o) {
          n.splice(0, 0, a);
        }
      }
    }
  }
  return n;
}
function getExtensionInfoMap() {
  return createExtensionInfoMap;
}
exports.defaultDownloadTypeInfoMap = {
  id: -1,
  name: "Zip Package",
  module: join(__dirname, "../contributions/extension.js"),
  download: "downloadZip",
  install: "copyZip",
};
