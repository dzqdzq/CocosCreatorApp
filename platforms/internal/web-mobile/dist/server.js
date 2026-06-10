var __awaiter =
  (this && this.__awaiter) ||
  ((t, s, i, p) =>
    new (i = i || Promise)((r, e) => {
      function o(t) {
        try {
          n(p.next(t));
        } catch (t) {
          e(t);
        }
      }
      function a(t) {
        try {
          n(p.throw(t));
        } catch (t) {
          e(t);
        }
      }
      function n(t) {
        var e;

        if (t.done) {
          r(t.value);
        } else {
          ((e = t.value) instanceof i
            ? e
            : new i((t) => {
                t(e);
              })
          ).then(o, a);
        }
      }
      n((p = p.apply(t, s || [])).next());
    }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.get = undefined;
exports.removeServerRoot = undefined;
exports.setRootPath = undefined;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
let rootMap = {};
function setRootPath(t) {
  rootMap[path_1.basename(t)] = t;
}
function removeServerRoot(t) {
  delete rootMap[path_1.basename(t)];
}
async function handle(n, s, i) {
  var t = path_1.join(Editor.Project.path, "build-templates", "web-mobile");
  var e = n.params[1];
  var r = rootMap[n.params[0]];
  if (!r) {
    return i(new Error(n.params[0] + " 未启动服务"));
  }
  let o = path_1.join(t, e);
  if (fs_extra_1.existsSync(o)) {
    const a = fs_extra_1.statSync(o);

    if (
      a.isDirectory() &&
      ((o = path_1.join(o, "index.html")), fs_extra_1.existsSync(o))
    ) {
      s.sendFile(o);
    }
  }
  o = path_1.join(r, e);

  if (!fs_extra_1.existsSync(o)) {
    return i(new Error(n.params[0] + " 资源不存在"));
  }

  const a = fs_extra_1.statSync(o);
  if (
    a.isDirectory() &&
    ((o = path_1.join(o, "index.html")), !fs_extra_1.existsSync(o))
  ) {
    return i(new Error(n.params[0] + " 资源不存在"));
  }
  s.sendFile(o);
}
exports.setRootPath = setRootPath;
exports.removeServerRoot = removeServerRoot;
exports.get = [{ url: "/web-mobile/*/*", handle }];
