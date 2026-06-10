Object.defineProperty(exports, "__esModule", { value: true });
exports.get = undefined;
exports.setRootPath = setRootPath;
exports.removeServerRoot = removeServerRoot;

const { existsSync, statSync } = require("fs-extra");

const { basename, join } = require("path");

const rootMap = {};
function setRootPath(t) {
  rootMap[basename(t)] = t;
}
function removeServerRoot(t) {
  delete rootMap[basename(t)];
}
async function handle(t, e, s) {
  var r = join(Editor.Project.path, "build-templates", "web-desktop");

  var a = t.params[1];
  var o = rootMap[t.params[0]];
  if (!o) {
    return e.status(503).send(t.params[0] + " 未启动服务");
  }
  let n = join(r, a);
  if (existsSync(n)) {
    const i = statSync(n);

    if (i.isDirectory() && ((n = join(n, "index.html")), existsSync(n))) {
      e.sendFile(n);
    }
  }
  n = join(o, a);

  if (!existsSync(n)) {
    return e.status(404).send(t.params[0] + " 资源不存在");
  }

  const i = statSync(n);
  if (i.isDirectory() && ((n = join(n, "index.html")), !existsSync(n))) {
    return e.status(404).send(t.params[0] + " 资源不存在");
  }
  e.sendFile(n);
}
exports.get = [{ url: "/web-desktop/*/*", handle }];
