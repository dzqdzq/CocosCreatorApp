var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, r, n = r) => {
        var i = Object.getOwnPropertyDescriptor(t, r);

        if (
          !i ||
          (!("get" in i) ? !i.writable && !i.configurable : t.__esModule)
        ) {
          i = {
            enumerable: true,
            get() {
              return t[r];
            },
          };
        }

        Object.defineProperty(e, n, i);
      }
    : (e, t, r, n) => {
        e[(n = n === undefined ? r : n)] = t[r];
      });

var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? (e, t) => {
        Object.defineProperty(e, "default", { enumerable: true, value: t });
      }
    : (e, t) => {
        e.default = t;
      });

var __importStar =
  (this && this.__importStar) ||
  (() => {
    var i = (e) =>
      (i =
        Object.getOwnPropertyNames ||
        ((e) => {
          var t;
          var r = [];
          for (t in e) {
            if (Object.prototype.hasOwnProperty.call(e, t)) {
              r[r.length] = t;
            }
          }
          return r;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var t = {};
      if (e != null) {
        for (var r = i(e), n = 0; n < r.length; n++) {
          if (r[n] !== "default") {
            __createBinding(t, e, r[n]);
          }
        }
      }
      __setModuleDefault(t, e);
      return t;
    };
  })();

Object.defineProperty(exports, "__esModule", { value: true });
exports.getClientID = getClientID;
exports.formatBytes = formatBytes;
exports.valueInvalid = valueInvalid;
exports.getMainDisplay = getMainDisplay;

const { join } = require("path");

module.paths.push(join(Editor.App.path, "node_modules"));
const windows = __importStar(require("@base/electron-windows"));

const electron_1 = require("electron");
const md5 = require("md5");
const getmac = require("getmac");
async function getClientID() {
  return new Promise((t) => {
    try {
      var e = getmac.default();
      return t(md5(e));
    } catch (e) {
      console.debug(e);
      var r = require("os").networkInterfaces();
      for (const a in r) {
        if (a) {
          var n = r[a];
          for (let e = 0; e < n.length; ++e) {
            var i = n[e];
            if (!i.internal && i.mac) {
              return t(md5(i.mac));
            }
          }
        }
      }
      return t(md5("00:00:00:00:00:00"));
    }
  });
}
function formatBytes(e, t = 3) {
  var r;
  return e === 0
    ? "0 Bytes"
    : ((t = t < 0 ? 0 : t),
      (r = Math.floor(Math.log(e) / Math.log(1024))),
      parseFloat((e / 1024 ** r).toFixed(t)) +
        " " +
        ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"][r]);
}
function valueInvalid(e) {
  return e == null;
}
function getMainDisplay() {
  var e = windows.uuids[0];
  var e = windows.uuid2win[e];
  let t = null;
  if (e) {
    var r = e.getBounds();
    var n = electron_1.screen.getAllDisplays();
    for (let e = 0; e < n.length; e++) {
      var i = n[e].bounds;
      if (
        r.x > i.x &&
        r.y > i.y &&
        r.x < i.x + i.width &&
        r.y < i.y + i.height
      ) {
        t = n[e];
        break;
      }
    }
    if (!t) {
      for (let e = 0; e < n.length; e++) {
        var a = n[e].bounds;
        if (
          r.x + r.width > a.x &&
          r.y > a.y &&
          r.x + r.width < a.x + a.width &&
          r.y < a.y + a.height
        ) {
          t = n[e];
          break;
        }
      }
    }
  }
  return (t = t || electron_1.screen.getPrimaryDisplay());
}
