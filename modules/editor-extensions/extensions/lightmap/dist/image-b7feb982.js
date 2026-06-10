var fs = require("fs");
var ps = require("path");
function _interopDefaultLegacy(t) {
  return t && typeof t == "object" && "default" in t ? t : { default: t };
}
var fs__default = _interopDefaultLegacy(fs);
class Profile {
  static async getLatestLightmapResults(t) {
    return (
      (await Editor.Profile.getProject(
        "lightmap",
        `latestLightmapResultMap.${t}.results`
      )) ?? []
    );
  }
  static setLatestLightmapResults(t, e) {
    Editor.Profile.setProject(
      "lightmap",
      `latestLightmapResultMap.${t}.results`,
      e
    );
  }
  static async setLatestLightmapResultsDir(t, e) {
    Editor.Profile.setProject(
      "lightmap",
      `latestLightmapResultMap.${t}.dir`,
      Editor.Utils.Path.normalize(e)
    );
  }
  static async getLatestLightmapResultDir(t) {
    return Editor.Profile.getProject(
      "lightmap",
      `latestLightmapResultMap.${t}.dir`
    );
  }
}
let filesList = [];
function convertTime(t) {
  t = new Date(t);
  return (
    t.getFullYear() +
    "-" +
    (t.getMonth() + 1).toString().padStart(2, "0") +
    "-" +
    t.getDate().toString().padStart(2, "0") +
    " " +
    t.getHours().toString().padStart(2, "0") +
    ":" +
    t.getMinutes().toString().padStart(2, "0") +
    ":" +
    t.getSeconds().toString().padStart(2, "0")
  );
}
async function readImageList(t, e = false) {
  if (!e) {
    filesList = [];
  }

  e = fs__default.default.readdirSync(t);

  await Promise.all(
    e.map(async (e) => {
      var a = ps.join(t, e);
      var i = fs__default.default.statSync(a);
      if (i.isDirectory()) {
        readImageList(a, true);
      } else if (e.endsWith(".png")) {
        var r = await Editor.Message.request("asset-db", "query-url", a);
        let t = null;

        if (r) {
          t = await Editor.Message.request("asset-db", "query-uuid", r);
        }

        r = {
          path: a,
          filename: e,
          size: formatBytes(i.size),
          birthtime: convertTime(i.birthtime),
          uuid: t,
          mtime: convertTime(i.mtime),
        };
        filesList.push(r);
      }
    })
  );

  return filesList;
}
async function getImageInfo(t) {
  var e = await Editor.Message.request("asset-db", "query-path", t);
  if (!e) {
    return null;
  }
  try {
    var a = fs__default.default.statSync(e);
    return {
      path: e,
      filename: ps.basename(e),
      size: formatBytes(a.size),
      birthtime: convertTime(a.birthtime),
      uuid: t,
      mtime: convertTime(a.mtime),
    };
  } catch (t) {
    console.debug(t);
    return null;
  }
}
function formatBytes(t, e = 2) {
  var a;
  return t === 0
    ? "0 Bytes"
    : ((e = e < 0 ? 0 : e),
      (a = Math.floor(Math.log(t) / Math.log(1024))),
      parseFloat((t / 1024 ** a).toFixed(e)) +
        " " +
        ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"][a]);
}
exports.Profile = Profile;
exports.formatBytes = formatBytes;
exports.getImageInfo = getImageInfo;
exports.readImageList = readImageList;
