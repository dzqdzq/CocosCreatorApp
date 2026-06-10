const { basename, join, extname } = require("path");
const { copyFileSync, ensureDir, outputFileSync } = require("fs-extra");
const EventEmitter = require("events").EventEmitter;
const TEMP_PATH = join(Editor.Project.path, "temp");
const DB_PROTOCOL_HEADER = "db://";
async function getEnginInfo() {
  return await Editor.Message.request("engine", "query-engine-info");
}
function getRightUrl(e) {
  if (e.startsWith(DB_PROTOCOL_HEADER)) {
    if (!e.slice(DB_PROTOCOL_HEADER.length)) {
      console.error("unknown mount to build: " + e);
      return null;
    }
  }

  console.error("unknown path to build: " + e);
  return e;
}
async function writScripts() {
  var t = await Editor.Message.request("asset-db", "query-assets", {
    ccType: "cc.Script",
  });

  var n = join(TEMP_PATH, "/quick-scripts");
  ensureDir(join(n, "assets"));
  for (let e = 0; e < t.length; e++) {
    var r = t[e];
    var i = getRightUrl(r.source);
    var s = extname(i);
    var s = basename(i, s);
    var o = basename(r.library[".js"]).replace(r.uuid, s);
    var s = basename(r.library[".js.map"]).replace(r.uuid, s);
    var i = getModules(i);
    outputFileSync(join(n, "assets", o), i);
    copyFileSync(r.library[".js.map"], join(n, "assets", s));
  }
  return n;
}
module.exports = { getEnginInfo, writScripts };
