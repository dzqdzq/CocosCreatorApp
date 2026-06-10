async function handler(e, r) {
  var t = require("path");
  require("fs");
  var e = require("url").parse(decodeURIComponent(e.url));
  var e = t.join(e.hostname, e.pathname);
  r({ path: t.join(Editor.Project.tmpDir, e) });
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.type = undefined;
exports.handler = handler;
exports.type = "registerFileProtocol";
