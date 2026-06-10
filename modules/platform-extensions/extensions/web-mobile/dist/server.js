Object.defineProperty(exports, "__esModule", { value: true });
exports.get = undefined;
exports.setRootPath = setRootPath;
exports.removeServerRoot = removeServerRoot;

const { existsSync, statSync } = require("fs-extra");

const { basename, join } = require("path");

const rootMap = {};
function setRootPath(e) {
  rootMap[basename(e)] = e;
}
function removeServerRoot(e) {
  delete rootMap[basename(e)];
}
async function handle(e, t, s) {
  var r = join(Editor.Project.path, "build-templates", "web-mobile");

  var a = e.params[1];
  var o = rootMap[e.params[0]];
  if (!o) {
    return t.status(503).send(e.params[0] + " 未启动服务");
  }
  let n = join(r, a);
  if (existsSync(n)) {
    const i = statSync(n);

    if (i.isDirectory() && ((n = join(n, "index.html")), existsSync(n))) {
      t.sendFile(n);
    }
  }
  n = join(o, a);

  if (!existsSync(n)) {
    return t.status(404).send(e.params[0] + " 资源不存在");
  }

  const i = statSync(n);
  if (i.isDirectory() && ((n = join(n, "index.html")), !existsSync(n))) {
    return t.status(404).send(e.params[0] + " 资源不存在");
  }
  t.sendFile(n);
}
exports.get = [{ url: "/web-mobile/*/*", handle }];
