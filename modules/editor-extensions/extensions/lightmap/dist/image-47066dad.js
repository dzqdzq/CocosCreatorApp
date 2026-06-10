const fs = require("fs");
const join = require("path").join;
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

  e = fs.readdirSync(t);

  await Promise.all(
    e.map(async (e) => {
      var r = join(t, e);
      var i = fs.statSync(r);
      if (i.isDirectory()) {
        readImageList(r, true);
      } else if (e.endsWith(".png")) {
        var a = await Editor.Message.request("asset-db", "query-url", r);
        let t = null;

        if (a) {
          t = await Editor.Message.request("asset-db", "query-uuid", a);
        }

        a = {
          path: r,
          filename: e,
          size: formatBytes(i.size),
          birthtime: convertTime(i.birthtime),
          uuid: t,
          mtime: convertTime(i.mtime),
        };
        filesList.push(a);
      }
    })
  );

  return filesList;
}
function formatBytes(t, e = 2) {
  var r;
  return t === 0
    ? "0 Bytes"
    : ((e = e < 0 ? 0 : e),
      (r = Math.floor(Math.log(t) / Math.log(1024))),
      parseFloat((t / 1024 ** r).toFixed(e)) +
        " " +
        ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"][r]);
}
exports.formatBytes = formatBytes;
exports.readImageList = readImageList;
