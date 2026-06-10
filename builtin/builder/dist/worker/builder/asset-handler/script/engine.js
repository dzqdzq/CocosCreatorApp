var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, n, a = n) => {
        var r = Object.getOwnPropertyDescriptor(t, n);

        if (
          !r ||
          (!("get" in r) ? !r.writable && !r.configurable : t.__esModule)
        ) {
          r = {
            enumerable: true,
            get() {
              return t[n];
            },
          };
        }

        Object.defineProperty(e, a, r);
      }
    : (e, t, n, a) => {
        e[(a = a === undefined ? n : a)] = t[n];
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
    var r = (e) =>
      (r =
        Object.getOwnPropertyNames ||
        ((e) => {
          var t;
          var n = [];
          for (t in e) {
            if (Object.prototype.hasOwnProperty.call(e, t)) {
              n[n.length] = t;
            }
          }
          return n;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var t = {};
      if (e != null) {
        for (var n = r(e), a = 0; a < n.length; a++) {
          if (n[a] !== "default") {
            __createBinding(t, e, n[a]);
          }
        }
      }
      __setModuleDefault(t, e);
      return t;
    };
  })();

var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));

Object.defineProperty(exports, "__esModule", { value: true });
exports.buildEngineX = buildEngineX;
exports.buildSplitEngine = buildSplitEngine;
exports.queryEngineImportMap = queryEngineImportMap;

const { createHash } = require("crypto");

const { join, dirname, basename } = require("path");

const {
  emptyDir,
  copy,
  pathExists,
  readJson,
  outputJSON,
} = require("fs-extra");

const ccBuild = __importStar(require("@cocos/ccbuild"));
const fs_extra_2 = __importDefault(require("fs-extra"));
const path_2 = __importDefault(require("path"));
const sub_process_manager_1 = require("../../../worker-pools/sub-process-manager");
const fast_glob_1 = __importDefault(require("fast-glob"));

const { parseMangleConfig } = require("./mangle-config-parser");

const default_mangle_config_1 = require("./default-mangle-config");
const EngineCacheName = "engine-cache";
const exportsMetaFile = "meta.json";
async function buildEngineX(e, t) {
  var { output: t, metaFile } = await buildEngine(e, t);
  await emptyDir(e.output);
  await copy("" + t, e.output, { recursive: true });
  return { metaFile: metaFile };
}
const fixedMd5Keys = [
  "debug",
  "sourceMaps",
  "includeModules",
  "engineVersion",
  "platformType",
  "split",
  "nativeCodeBundleMode",
  "targets",
  "entry",
  "noDeprecatedFeatures",
  "loose",
  "assetURLFormat",
  "flags",
  "preserveType",
  "wasmCompressionMode",
  "enableNamedRegisterForSystemJSModuleFormat",
  "mangleProperties",
  "inlineEnum",
];
async function buildEngine(n, a) {
  var r = (
    await Editor.Message.request("engine", "query-engine-modules-profile")
  )?.noDeprecatedFeatures ?? { value: false, version: "" };

  var i = await Editor.Profile.getProject("project", "script.loose");
  var r = r.value ? r.version || true : undefined;
  var o = { noDeprecatedFeatures: r, loose: i };
  var s = join(Editor.Project.path, "engine-mangle-config.json");

  if (n.mangleProperties && !(await fs_extra_2.default.pathExists(s))) {
    console.debug(
      "mangleProperties is enabled, but engine-mangle-config.json not found, create default mangle configuration"
    );

    default_mangle_config_1.defaultMangleConfig.__doc_url__ =
      Editor.Utils.Url.getDocUrl("advanced-topics/mangle-properties.html");

    await fs_extra_2.default.writeJson(
      s,
      default_mangle_config_1.defaultMangleConfig,
      { spaces: 2 }
    );
  } else {
    console.debug(
      "mangleProperties is enabled, found engine-mangle-config.json, use it"
    );
  }

  var l = n.md5Map.length === 0 ? fixedMd5Keys : n.md5Map.concat(fixedMd5Keys);

  let u = calcMd5String(Object.assign(o, n), l);

  if (n.mangleProperties) {
    u += `projectPath=${Editor.Project.path},`;

    console.debug(
      "Found mangle config, append projectPath to md5String: " +
        u.split(",").join(",\n")
    );
  }

  var o = createHash("md5").update(u).digest("hex");
  var l = join(Editor.App.temp, "builder", "engine", o);
  var o = join(dirname(l), o + ".meta");
  var c = l + ".watch-files.json";
  var o = join(o, exportsMetaFile);
  if (n.useCache && (await validateCache(l, c)) && (await isValidMeta(o))) {
    console.debug(`Use cache engine: {link(${l})}`);
    console.debug("Use cache, md5String: " + u.split(",").join(",\n"));
    console.debug("Use cache, options: " + JSON.stringify(n, null, 2));
  } else {
    let e = 0;
    let t = false;

    if (n.mangleProperties) {
      if (a.NATIVE) {
        console.warn(
          "Currently, mangling internal properties is not supported on native platforms, current platform: " +
            n.platformType
        );
      } else if (undefined === (t = parseMangleConfig(s, n.platformType))) {
        console.debug(
          "engine-mangle-config.json not found, but mangleProperties is enabled, so enable mangleProperties with default mangle configuration"
        );

        t = true;
      } else {
        e = (await fs_extra_2.default.stat(s)).mtimeMs;
        console.debug("mangleProperties: " + JSON.stringify(t, null, 2));
      }
    } else {
      console.debug(
        "mangleProperties is disabled, platform: " + n.platformType
      );
    }

    a = {
      incremental: c,
      engine: n.entry,
      out: l,
      moduleFormat: "system",
      compress: !n.debug,
      nativeCodeBundleMode: n.nativeCodeBundleMode,
      assetURLFormat: n.assetURLFormat,
      noDeprecatedFeatures: r,
      sourceMap: n.sourceMaps,
      targets: n.targets,
      loose: i,
      features: n.includeModules,
      platform: n.platformType,
      flags: n.flags,
      mode: "BUILD",
      metaFile: o,
      preserveType: n.preserveType,
      wasmCompressionMode: n.wasmCompressionMode,
      enableNamedRegisterForSystemJSModuleFormat:
        n.enableNamedRegisterForSystemJSModuleFormat,
      inlineEnum: n.inlineEnum,
      mangleProperties: t,
      mangleConfigJsonMtime: e,
    };

    await sub_process_manager_1.workerManager.registerTask({
      name: "build-engine",
      path: join(__dirname, "./build-engine"),
    });

    console.debug(
      "Cache is invalid, start build engine with options: " +
        JSON.stringify(a, null, 2)
    );

    console.debug("md5String: " + u.split(",").join(",\n"));

    await sub_process_manager_1.workerManager.runTask(
      "build-engine",
      "buildEngineCommand",
      [a]
    );

    await outputCacheJson(n, l);
    sub_process_manager_1.workerManager.kill("build-engine");
    console.debug("build engine done: output: " + l);
  }
  return { output: l, metaFile: o };
}
async function buildSplitEngine(e) {
  await sub_process_manager_1.workerManager.registerTask({
    name: "build-engine",
    path: join(__dirname, "./build-engine"),
  });

  return sub_process_manager_1.workerManager.runTask(
    "build-engine",
    "buildSeparateEngine",
    [e]
  );
}
async function validateCache(e, t) {
  if (!(await fs_extra_2.default.pathExists(e))) {
    console.debug(`Engine cache (${e}) does not exist.`);
    return false;
  }
  let n = false;
  try {
    if ((await (0, fast_glob_1.default)("**/*.js", { cwd: e })).length !== 0) {
      n = true;
    }
  } catch {}
  return n
    ? !(await ccBuild.buildEngine.isSourceChanged(t))
    : (console.warn(
        `Engine cache directory({link(${e})}) exists but has empty content. It's abnormal.`
      ),
      false);
}
async function isValidMeta(e) {
  if (!(await pathExists(e))) {
    return false;
  }
  let t;
  try {
    t = await fs_extra_2.default.readJson(e);
  } catch (e) {
    return false;
  }
  if (typeof t != "object" || t === null) {
    return false;
  }
  if (typeof t.exports != "object") {
    return false;
  }
  e = join(Editor.Project.path, "engine-mangle-config.json");
  if (await fs_extra_2.default.pathExists(e)) {
    var e = (await fs_extra_2.default.stat(e)).mtimeMs;
    var n = new Date(e).toLocaleString();
    var t_mangleConfigJsonMtime = t.mangleConfigJsonMtime;
    var r =
      t_mangleConfigJsonMtime !== undefined
        ? new Date(t_mangleConfigJsonMtime).toLocaleString()
        : 0;
    if (e !== t_mangleConfigJsonMtime) {
      console.debug(
        `engine-mangle-config.json mtime changed: now: ${n} !== old: ` + r
      );

      return false;
    }
    console.debug(
      `engine-mangle-config.json mtime isn't changed: now: ${n} === old: ` + r
    );
  }
  return true;
}
function calcMd5String(e, t) {
  let n = "";
  for (const a of t) {
    n += `${a}=${JSON.stringify(e[a])},`;
  }
  return n;
}
async function outputCacheJson(e, t) {
  var n = join(dirname(t), EngineCacheName + ".json");
  let a = {};
  a = (a = (await pathExists(n)) ? await readJson(n) : a) || {};
  t = basename(t);
  a[t] = e;
  await outputJSON(n, a);
}
async function queryEngineImportMap(e, n, a, t) {
  let r;
  try {
    r = await fs_extra_2.default.readJson(e);
  } catch (e) {
    throw new Error(
      "Failed to read engine export meta, engine might not have been build correctly: " +
        e
    );
  }
  const i = t ? new URL(t) : undefined;
  var o;
  var s;
  var l;
  var u;

  var c = (e) => {
    let t;
    return (t = i
      ? new URL(e, i).href
      : "./" + Build.Utils.relativeUrl(a, path_2.default.join(n, e)));
  };

  var g = {};
  for ([o, s] of Object.entries(r.exports)) {
    g[o] = c(s);
  }
  for ([l, u] of Object.entries(r.chunkAliases)) {
    g[l] = c(u);
  }
  return g;
}
