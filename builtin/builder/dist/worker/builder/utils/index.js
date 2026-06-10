var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, r, t, o = t) => {
        var s = Object.getOwnPropertyDescriptor(r, t);

        if (
          !s ||
          (!("get" in s) ? !s.writable && !s.configurable : r.__esModule)
        ) {
          s = {
            enumerable: true,
            get() {
              return r[t];
            },
          };
        }

        Object.defineProperty(e, o, s);
      }
    : (e, r, t, o) => {
        e[(o = o === undefined ? t : o)] = r[t];
      });

var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? (e, r) => {
        Object.defineProperty(e, "default", { enumerable: true, value: r });
      }
    : (e, r) => {
        e.default = r;
      });

var __importStar =
  (this && this.__importStar) ||
  (() => {
    var s = (e) =>
      (s =
        Object.getOwnPropertyNames ||
        ((e) => {
          var r;
          var t = [];
          for (r in e) {
            if (Object.prototype.hasOwnProperty.call(e, r)) {
              t[t.length] = r;
            }
          }
          return t;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var r = {};
      if (e != null) {
        for (var t = s(e), o = 0; o < t.length; o++) {
          if (t[o] !== "default") {
            __createBinding(r, e, t[o]);
          }
        }
      }
      __setModuleDefault(r, e);
      return r;
    };
  })();

var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));

Object.defineProperty(exports, "__esModule", { value: true });
exports.quickSpawn = undefined;
exports.transI18nName = undefined;
exports.compareOptions = compareOptions;
exports.pickDifferentOptions = pickDifferentOptions;
exports.copyPaths = copyPaths;
exports.recursively = recursively;
exports.removeDbHeader = removeDbHeader;
exports.dbUrlToRawPath = dbUrlToRawPath;
exports.relativeUrl = relativeUrl;
exports.isInstallNodeJs = isInstallNodeJs;
exports.getFileSizeDeep = getFileSizeDeep;
exports.copyDirSync = copyDirSync;
exports.compressUuid = compressUuid;
exports.decompressUuid = decompressUuid;
exports.getUuidFromPath = getUuidFromPath;
exports.nameToSubId = nameToSubId;
exports.getResImportPath = getResImportPath;
exports.getResRawAssetsPath = getResRawAssetsPath;
exports.toBabelModules = toBabelModules;
exports.transformCode = transformCode;
exports.compileJS = compileJS;
exports.getBuildPath = getBuildPath;
exports.createBundle = createBundle;
exports.appendMd5ToPaths = appendMd5ToPaths;
exports.calcMd5 = calcMd5;
exports.patchMd5ToPath = patchMd5ToPath;
exports.getLibraryDir = getLibraryDir;
exports.queryImageAssetFromSubAssetByUuid = queryImageAssetFromSubAssetByUuid;

const { join, relative, dirname, parse, format } = require("path");

const { exec } = require("child_process");

const {
  existsSync,
  statSync,
  readdirSync,
  copyFileSync,
  writeFileSync,
} = require("fs");

const { copy, ensureDirSync, readFile, rename } = require("fs-extra");

const babel = __importStar(require("@babel/core"));
const preset_env_1 = __importDefault(require("@babel/preset-env"));
const sub_process_manager_1 = require("../../worker-pools/sub-process-manager");
const utils_1 = require("../../../share/utils");
let EditorExtends;
function getEditorExtends() {
  return (EditorExtends =
    EditorExtends || require("@base/electron-module").require("EditorExtends"));
}
function compareOptions(e, r) {
  const t = pickDifferentOptions(e, r);
  return (
    !!t.isEqual ||
    (console.log(
      "different options: " +
        Object.keys(t.diff).map(
          (e) => `${e}: ${t.diff[e].old} -> ` + t.diff[e].new
        )
    ),
    false)
  );
}
function pickDifferentOptions(e, r, o = "", s = {}) {
  let n = true;
  var t = (e, r, t) => {
    s[o ? o + "." + e : e] = { new: t, old: r };
    n = false;
  };
  if (typeof e != "object" || typeof r != "object") {
    if (e !== r) {
      t("", e, r);
    }
  } else {
    for (const u of new Set([...Object.keys(e), ...Object.keys(r)])) {
      var i = e[u];
      var a = r[u];

      if (
        typeof i == "object" &&
        typeof a == "object" &&
        i !== null &&
        a !== null
      ) {
        if (!pickDifferentOptions(i, a, o ? o + "." + u : u, s).isEqual) {
          n = false;
        }
      } else if (i !== a) {
        t(u, i, a);
      }
    }
  }
  return { diff: s, isEqual: n };
}
function copyPaths(e) {
  return Promise.all(e.map((e) => copy(e.src, e.dest)));
}
function recursively(r, t) {
  if (r.subAssets) {
    t && t(r);

    Object.keys(r.subAssets).forEach((e) => {
      recursively(r.subAssets[e], t);
    });
  }
}
const DB_PROTOCOL_HEADER = "db://";
function removeDbHeader(e) {
  return e
    ? e.startsWith(DB_PROTOCOL_HEADER)
      ? e.slice(DB_PROTOCOL_HEADER.length)
      : (console.error("unknown path to build: " + e), e)
    : "";
}
function dbUrlToRawPath(e) {
  return join(Editor.Project.path, removeDbHeader(e));
}
function relativeUrl(e, r) {
  return relative(e, r).replace(/\\/g, "/");
}
function isInstallNodeJs() {
  return new Promise((r, e) => {
    exec("node -v", { env: process.env }, (e) => {
      if (e) {
        console.error(e);

        process.platform === "win32"
          ? console.error(
              new Error(Editor.I18n.t("builder.window_default_npm_path_error"))
            )
          : console.error(
              new Error(Editor.I18n.t("builder.mac_default_npm_path_error"))
            );

        r(false);
      } else {
        r(true);
      }
    });
  });
}
function getFileSizeDeep(r) {
  if (!existsSync(r)) {
    return 0;
  }
  var e = statSync(r);
  if (!e.isDirectory()) {
    return e.size;
  }
  let t = 0;

  readdirSync(r).forEach((e) => {
    t += getFileSizeDeep(join(r, e));
  });

  return t;
}
function copyDirSync(r, t) {
  var e;
  return existsSync(r)
    ? statSync(r).isDirectory()
      ? ((e = readdirSync(r)),
        ensureDirSync(t),
        void e.forEach((e) => {
          copyDirSync(join(r, e), join(t, e));
        }))
      : (ensureDirSync(dirname(t)), copyFileSync(r, t))
    : 0;
}
function compressUuid(e, r = true) {
  return getEditorExtends().UuidUtils.compressUuid(e, r);
}
function decompressUuid(e) {
  return getEditorExtends().UuidUtils.decompressUuid(e);
}
function getUuidFromPath(e) {
  return getEditorExtends().UuidUtils.getUuidFromLibPath(e);
}
function nameToSubId(e) {
  return getEditorExtends().UuidUtils.nameToSubId(e);
}
function getResImportPath(e, r, t = ".json") {
  return join(e, Build.IMPORT_HEADER, r.substr(0, 2), r + t);
}
function getResRawAssetsPath(e, r, t) {
  return join(e, Build.NATIVE_HEADER, r.substr(0, 2), r + t);
}
function toBabelModules(e) {
  return e !== "esm" && e;
}
async function transformCode(e, r) {
  var { loose: r, importMapFormat } = r;

  var e = await babel.transformAsync(e, {
    presets: [
      [
        preset_env_1.default,
        {
          modules: importMapFormat
            ? toBabelModules(importMapFormat)
            : undefined,
          loose: r == null || r,
        },
      ],
    ],
  });

  if (e && e.code) {
    return e.code;
  }
  throw new Error("Failed to transform!");
}
function compileJS(e, r) {
  let t;
  try {
    var o = require("@babel/core");
    t = o.transform(e, {
      ast: false,
      highlightCode: false,
      sourceMaps: false,
      compact: false,
      filename: r,
      presets: [require("@babel/preset-env")],
      plugins: [
        [require("@babel/plugin-proposal-decorators"), { legacy: true }],
        [require("@babel/plugin-proposal-class-properties"), { loose: true }],
        [require("babel-plugin-add-module-exports")],
        [require("@babel/plugin-proposal-export-default-from")],
      ],
    });
  } catch (e) {
    e.stack = `Compile ${r} error: ` + e.stack;
    throw e;
  }
  return t.code;
}
function getBuildPath(e) {
  return join(
    Editor.UI.__protected__.File.resolveToRaw(e.buildPath),
    e.outputName
  );
}
async function createBundle(s, n, i) {
  return new Promise((t, o) => {
    var e = require("babelify");
    const r = require("browserify")(s);

    if (i && i.excludes) {
      i.excludes.forEach((e) => {
        r.exclude(e);
      });
    }

    ensureDirSync(dirname(n));

    r.transform(e, {
      presets: [require("@babel/preset-env")],
      plugins: [require("@babel/plugin-proposal-class-properties")],
    }).bundle((e, r) => {
      if (e) {
        console.error(e);
        o(e);
      } else {
        writeFileSync(n, new Uint8Array(r), "utf8");
        t();
      }
    });
  });
}
exports.transI18nName = utils_1.transI18nName;
const HASH_LEN = 5;
async function appendMd5ToPaths(e) {
  if (!Array.isArray(e)) {
    return null;
  }
  var r;
  var t = [];
  for (const n of (e = e.sort())) {
    try {
      r = await readFile(n);
      t.push(r);
    } catch (e) {
      console.error(e);
      console.error(`readFile {link(${n})}`);
      continue;
    }
  }
  const o = calcMd5(t);
  const s = [];

  await Promise.all(
    e.map((e, r) => {
      s[r] = patchMd5ToPath(e, o);
      return rename(e, s[r]);
    })
  );

  return { paths: s, hash: o };
}
function calcMd5(e) {
  e = Array.isArray(e) ? e : [e];
  var r = require("crypto").createHash;
  const t = r("md5");

  e.forEach((e) => {
    t.update(e);
  });

  return t.digest("hex").slice(0, HASH_LEN);
}
function patchMd5ToPath(e, r) {
  e = parse(e);
  e.base = "";
  e.name += "." + r;
  return format(e);
}
function getLibraryDir(e) {
  return e.match(
    /(.*)[/\\][0-9a-fA-F]{2}[/\\][0-9a-fA-F-]{8,}((@[0-9a-fA-F]{5,})+)?.*/
  )[1];
}
function queryImageAssetFromSubAssetByUuid(e) {
  return e.split("@")[0];
}
exports.quickSpawn = sub_process_manager_1.workerManager.quickSpawn.bind(
  sub_process_manager_1.workerManager
);
