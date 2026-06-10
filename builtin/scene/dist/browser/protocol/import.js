Object.defineProperty(exports, "__esModule", { value: true });
exports.type = undefined;
exports.handler = handler;

const { join } = require("path");

async function handler(r, t) {
  const e = require("fs");
  r = require("url").parse(decodeURIComponent(r.url));
  const a = join(r.hostname, r.pathname);
  t({
    path:
      (await queryOtherLibraryPath())
        .map((r) => join(r, a))
        .find((r) => e.existsSync(r)) ||
      join(Editor.Project.path, "library", a),
  });
}
exports.type = "registerFileProtocol";
let otherLibraryPath = null;
async function queryOtherLibraryPath() {
  if (!otherLibraryPath) {
    try {
      var r = await Editor.Message.request("asset-db", "query-db-infos");
      otherLibraryPath = r.map((r) => r.library);
    } catch (r) {
      console.debug(r);

      otherLibraryPath = [join(Editor.App.temp, "asset-db/library")];
    }
  }
  return otherLibraryPath;
}
