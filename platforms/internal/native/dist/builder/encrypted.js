var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, r, n = r) => {
        Object.defineProperty(e, n, {
          enumerable: true,
          get() {
            return t[r];
          },
        });
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
  ((e) => {
    if (e && e.__esModule) {
      return e;
    }
    var t = {};
    if (e != null) {
      for (var r in e) {
        if (r !== "default" && Object.prototype.hasOwnProperty.call(e, r)) {
          __createBinding(t, e, r);
        }
      }
    }
    __setModuleDefault(t, e);
    return t;
  });

Object.defineProperty(exports, "__esModule", { value: true });

exports.replaceTeaKeyForGame = undefined;
exports.encryptJs = undefined;
exports.setEncryptConfig = undefined;

const path = __importStar(require("path"));
const fse = __importStar(require("fs-extra"));
const zlib_1 = require("zlib");
const xxtea = require("xxtea-node");
async function setEncryptConfig(e) {
  e.bundles.forEach((e) => {
    e.config.encrypted = true;
  });
}
async function encryptJs(n, a) {
  const i = path.join(n.paths.dir, "..", "script-backup");
  fse.ensureDirSync(i);
  fse.emptyDirSync(i);

  n.bundles.forEach((e) => {
    var e_scriptDest = e.scriptDest;
    let r = fse.readFileSync(e_scriptDest, "utf8");

    r = a.compressZip
      ? ((r = zlib_1.gzipSync(r)), xxtea.encrypt(r, xxtea.toBytes(a.xxteaKey)))
      : xxtea.encrypt(xxtea.toBytes(r), xxtea.toBytes(a.xxteaKey));

    e.scriptDest = path.join(
      path.dirname(e_scriptDest),
      path.basename(e_scriptDest, path.extname(e_scriptDest)) + ".jsc"
    );

    fse.writeFileSync(e.scriptDest, r);
    fse.copySync(
      e_scriptDest,
      path.join(i, path.relative(n.paths.dir, e_scriptDest))
    );
    fse.removeSync(e_scriptDest);
  });
}
function replaceTeaKeyForGame(t) {
  var e = path.join(
    Editor.Project.path,
    "native/engine/common",
    "Classes/Game.cpp"
  );
  if (fse.existsSync(e)) {
    var r = fse.readFileSync(e, "utf8").split("\n");
    for (let e = 0; e < r.length; e++) {
      if (r[e].includes("jsb_set_xxtea_key")) {
        r[e] = `    jsb_set_xxtea_key("${t.packages.native.xxteaKey}");`;
      }
    }
    fse.writeFileSync(e, r.join("\n"));
  } else {
    console.warn(`Can't find path [${e}]`);
  }
}
exports.setEncryptConfig = setEncryptConfig;
exports.encryptJs = encryptJs;
exports.replaceTeaKeyForGame = replaceTeaKeyForGame;
