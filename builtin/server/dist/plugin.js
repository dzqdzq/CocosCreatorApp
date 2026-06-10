var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });

exports.socketArray = undefined;
exports.postArray = undefined;
exports.getArray = undefined;
exports.fileArray = undefined;

exports.attach = attach;
exports.detach = detach;

const { join } = require("path");

const express_1 = __importDefault(require("express"));

const { getSocket } = require("./socket");

const { globToRegExp } = require("./glob2rex");

function attach(t) {
  if (!t.invalid && t.info.contributions && t.info.contributions.server) {
    var e = join(t.path, t.info.contributions.server);
    const o = (e) => (e instanceof RegExp ? e : globToRegExp(e));
    try {
      var r = Editor.Module.__protected__.requireFile(e);

      if (r.file) {
        r.file.forEach((e) => {
          var r;
          exports.fileArray.push({
            name: t.name,
            url: e.url,
            regexp: (r = e.url) instanceof RegExp ? r : globToRegExp(r + "*"),
            handle: express_1.default.static(e.path),
          });
        });
      }

      if (r.get) {
        r.get.forEach((e) => {
          exports.getArray.push({
            name: t.name,
            url: e.url,
            regexp: o(e.url),
            handle: e.handle,
          });
        });
      }

      if (r.post) {
        r.post.forEach((e) => {
          exports.postArray.push({
            name: t.name,
            url: e.url,
            regexp: o(e.url),
            handle: e.handle,
          });
        });
      }

      if (r.connection) {
        exports.socketArray.push({
          name: t.name,
          connection: r.connection,
          disconnect: r.disconnect,
        });
      }
    } catch (e) {
      console.error(e);
    }
  }
}
function detach(r) {
  for (let e = 0; e < exports.fileArray.length; e++) {
    if (exports.fileArray[e].name === r.name) {
      exports.fileArray.splice(e--, 1);
    }
  }
  for (let e = 0; e < exports.getArray.length; e++) {
    if (exports.getArray[e].name === r.name) {
      exports.getArray.splice(e--, 1);
    }
  }
  for (let e = 0; e < exports.postArray.length; e++) {
    if (exports.postArray[e].name === r.name) {
      exports.postArray.splice(e--, 1);
    }
  }
  for (let e = 0; e < exports.socketArray.length; e++) {
    if (exports.socketArray[e].name === r.name) {
      exports.socketArray[e].disconnect(getSocket());
      exports.socketArray.splice(e--, 1);
    }
  }
}
exports.fileArray = [];
exports.getArray = [];
exports.postArray = [];
exports.socketArray = [];
