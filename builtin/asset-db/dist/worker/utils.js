var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, r, i = r) => {
        var a = Object.getOwnPropertyDescriptor(t, r);

        if (
          !a ||
          (!("get" in a) ? !a.writable && !a.configurable : t.__esModule)
        ) {
          a = {
            enumerable: true,
            get() {
              return t[r];
            },
          };
        }

        Object.defineProperty(e, i, a);
      }
    : (e, t, r, i) => {
        e[(i = i === undefined ? r : i)] = t[r];
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
    var a = (e) =>
      (a =
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
        for (var r = a(e), i = 0; i < r.length; i++) {
          if (r[i] !== "default") {
            __createBinding(t, e, r[i]);
          }
        }
      }
      __setModuleDefault(t, e);
      return t;
    };
  })();

Object.defineProperty(exports, "__esModule", { value: true });
exports.PROMISE_STATE = undefined;
exports.url2path = url2path;
exports.getMemorySize = getMemorySize;
exports.url2uuid = url2uuid;
exports.libArr2Obj = libArr2Obj;
exports.getExtendsFromCCType = getExtendsFromCCType;
exports.tranAssetInfo = tranAssetInfo;
exports.decidePromiseState = decidePromiseState;
exports.removeFile = removeFile;
exports.moveFile = moveFile;
exports.serializeCompiledWithInstance = serializeCompiledWithInstance;
exports.getRawInstanceFromImportFile = getRawInstanceFromImportFile;
exports.serializeCompiled = serializeCompiled;
exports.ensureOutputData = ensureOutputData;
exports.transI18nName = transI18nName;
const asset_db_1 = require("@editor/asset-db");

const { queryPath, queryUUID, queryAsset } = asset_db_1;

const { isAbsolute, join, resolve, relative } = require("path");

const { existsSync, remove, move, readJSON, readFile } = require("fs-extra");

const EditorExtends = require("@base/electron-module").require("EditorExtends");
function url2path(t) {
  if (isAbsolute(t)) {
    return t;
  }
  if (t.startsWith("db://")) {
    return queryPath(t);
  }
  if (t.startsWith("packages")) {
    try {
      var e = t.match(/packages:\/\/([^/]*)\/(.*)$/);
      var r = Editor.Package.getPackages({ name: e[1] });
      return join(r[0].path, e[2]);
    } catch (e) {
      console.warn("Invalid package url " + t);
    }
  }
  return Editor.UI.__protected__.File.resolveToRaw(t);
}
function getMemorySize() {
  var e = process.memoryUsage();
  function t(e) {
    return (e / 1024 / 1024).toFixed(2) + "MB";
  }
  return (
    "Process: heapTotal " +
    t(e.heapTotal) +
    " heapUsed " +
    t(e.heapUsed) +
    " rss " +
    t(e.rss)
  );
}
function url2uuid(e) {
  const r = [];
  let t = e;
  let i = "";

  while (!(i = queryUUID(t)) && t !== "db:/") {
    t = t.replace(/\/([^/]*)$/, (e, t) => {
      r.splice(0, 0, asset_db_1.Utils.nameToId(t));
      return "";
    });
  }

  if (!i || !(e = queryAsset(t)) || (e.isDirectory() && r.length > 0)) {
    t = "";
  } else {
    t = e.uuid;
    r.length > 0 && (t += "@" + r.join("@"));
  }

  return t;
}
const extnameRex = /^\./;
function isExtname(e) {
  return e === "" || extnameRex.test(e);
}
function libArr2Obj(e) {
  var t = {};
  for (const r of e.meta.files) {
    if (isExtname(r)) {
      t[r] = e.library + r;
    } else {
      t[r] = resolve(e.library, r);
    }
  }
  return t;
}
function getExtendsFromCCType(e) {
  if (!e || e === "cc.Asset") {
    return [];
  }
  let t = cc.js.getSuper(cc.js.getClassByName(e));
  var r = [];
  let i = cc.js.getClassName(t);

  while (i && r[r.length - 1] !== "cc.Asset") {
    r.push(i);
    t = cc.js.getSuper(t);
    i = cc.js.getClassName(t);
  }

  return r;
}
function tranAssetInfo(e) {
  return {
    file: e.source,
    uuid: e.uuid,
    library: libArr2Obj(e),
    importer: e.meta.importer,
  };
}
function decidePromiseState(e) {
  const t = { name: "test" };
  return Promise.race([e, t])
    .then((e) =>
      e === t ? exports.PROMISE_STATE.PENDING : exports.PROMISE_STATE.FULFILLED
    )
    .catch(() => exports.PROMISE_STATE.REJECTED);
}
async function removeFile(t) {
  if (existsSync(t)) {
    try {
      await Editor.Utils.File.trashItem(t);
    } catch (e) {
      console.error(e);
      throw new Error(`asset db removeFile ${t} fail!`);
    }
    try {
      var e = t + ".meta";

      if (existsSync(e)) {
        await Editor.Utils.File.trashItem(e);
      }
    } catch (e) {}
  }
  return true;
}
async function moveFile(t, r, e) {
  if (existsSync(t) && existsSync(t + ".meta")) {
    if (!e) {
      if (existsSync(r) || existsSync(r + ".meta")) {
        return;
      }
      e = { overwrite: false };
    }
    var i = join(Editor.Project.tmpDir, "asset-db", "move-temp");
    var a = relative(Editor.Project.path, r);
    try {
      if (Editor.Utils.Path.contains(t, r)) {
        await remove(join(i, a));
        await remove(join(i, a) + ".meta");
        await move(t + ".meta", join(i, a) + ".meta", { overwrite: true });

        await move(t, join(i, a), {
          overwrite: true,
        });

        await move(join(i, a) + ".meta", r + ".meta", { overwrite: true });
        await move(join(i, a), r, e);
      } else {
        await move(t + ".meta", r + ".meta", {
          overwrite: true,
        });

        await move(t, r, e);
      }
    } catch (e) {
      console.error(`asset db moveFile from ${t} -> ${r} fail!`);
      console.error(e);
    }
  }
}
const defaultSerializeOptions = {
  compressUuid: true,
  stringify: !(exports.PROMISE_STATE = {
    PENDING: "pending",
    FULFILLED: "fulfilled",
    REJECTED: "rejected",
  }),
  dontStripDefault: false,
  useCCON: false,
  keepNodeUuid: false,
};
function serializeCompiledWithInstance(e, t) {
  return e
    ? EditorExtends.serializeCompiled(
        e,
        Object.assign(defaultSerializeOptions, {
          compressUuid: !t.debug,
          useCCON: t.useCCONB,
          noNativeDep: !e._native,
        })
      )
    : null;
}
async function getRawInstanceFromImportFile(e, t) {
  var e = e.endsWith(".json") ? await readJSON(e) : await transformCCON(e);

  var r = { asset: null, detail: null };

  var i = (await Promise.resolve().then(() => __importStar(require("cc"))))
    .deserialize;

  var a = new i.Details();
  a.reset();
  var s = EditorExtends.MissingReporter.classInstance;

  var i = i(e, a, {
    createAssetRefs: !(s.hasMissingClass = false),
    ignoreEditorOnly: true,
    classFinder: s.classFinder,
  });

  if (!i) {
    console.error(
      Editor.I18n.t("builder.error.deserialize_failed", {
        url: `{asset(${t.url})}`,
      })
    );

    return r;
  }
  i._uuid = t.uuid;
  s.reset();
  r.asset = i;
  r.detail = a;
}
async function transformCCON(e) {
  var e = await readFile(e);
  var e = new Uint8Array(e.buffer, e.byteOffset, e.byteLength);

  var t = (
    await Promise.resolve().then(() =>
      __importStar(require("cc/editor/serialization"))
    )
  ).decodeCCONBinary;

  return t(e);
}
async function serializeCompiled(e, t) {
  e = await getRawInstanceFromImportFile(ensureOutputData(e).import.path, {
    uuid: e.uuid,
    url: e.url,
  });
  return e?.asset ? serializeCompiledWithInstance(e.asset, t) : null;
}
function ensureOutputData(t) {
  let r = t.getData("output");
  if (!r) {
    r = { import: { type: "json", path: t.library + ".json" } };
    const i = {};

    t.meta.files.forEach((e) => {
      if ([".json", ".cconb"].includes(e)) {
        r.import.path = t.library + e;
        e === ".cconb" && (r.import.type = "buffer");
      } else if (!e.startsWith(".___")) {
        i[e] = t.library + e;
      }
    });

    if (Object.keys(i).length) {
      r.native = i;
    }

    t.setData("output", r);
  }
  return r;
}
function transI18nName(e) {
  return typeof e != "string"
    ? ""
    : (e.startsWith("i18n:") &&
        ((e = e.replace("i18n:", "")),
        Editor.I18n.t(e) || console.debug(e + " is not defined in i18n"),
        Editor.I18n.t(e))) ||
        e;
}
