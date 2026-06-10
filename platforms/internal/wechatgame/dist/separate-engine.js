var __createBinding =
    (this && this.__createBinding) ||
    (Object.create
      ? (e, t, n, i = n) => {
      Object.defineProperty(e, i, {
        enumerable: true,
        get() {
          return t[n];
        },
      });
    }
      : (e, t, n, i) => {
          e[(i = i === undefined ? n : i)] = t[n];
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
  (e => {
    if (e && e.__esModule) {
      return e;
    }
    var t = {};
    if (e != null) {
      for (var n in e) {
        if (n !== "default" &&
          Object.prototype.hasOwnProperty.call(e, n)) {
          __createBinding(t, e, n);
        }
      }
    }
    __setModuleDefault(t, e);
    return t;
  });

var __awaiter =
  (this && this.__awaiter) ||
  ((e, a, s, u) => new (s = s || Promise)((n, t) => {
    function i(e) {
      try {
        o(u.next(e));
      } catch (e) {
        t(e);
      }
    }
    function r(e) {
      try {
        o(u.throw(e));
      } catch (e) {
        t(e);
      }
    }
    function o(e) {
      var t;

      if (e.done) {
        n(e.value);
      } else {
        ((t = e.value) instanceof s
              ? t
              : new s(e => {
                  e(t);
                })
            ).then(i, r);
      }
    }
    o((u = u.apply(e, a || [])).next());
  }));

Object.defineProperty(exports, "__esModule", { value: true });

exports.calcCodeMd5 = undefined;
exports.outputSignatureMd5WithPath = undefined;
exports.querySignatureMd5 = undefined;
exports.generateCocos = undefined;
exports.getWechatPluginFeatures = undefined;
exports.buildCocos = undefined;
exports.separateEnginPaths = undefined;
exports.outDir = undefined;

const ccBuild = __importStar(require("@cocos/build-engine"));
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const crypto_1 = require("crypto");
const enumerate_dependent_chunks_js_1 = require("@cocos/build-engine/dist/enumerate-dependent-chunks.js");
const build_time_constants_1 = require("@cocos/build-engine/dist/build-time-constants");
const engineRoot = path_1.join(__dirname, "../../../../../resources/3d/engine");
function buildCocos(u = false) {
  return __awaiter(this, undefined, undefined, function* () {
    var e = exports.separateEnginPaths.internalEngine;
    var t = exports.separateEnginPaths.outDir;
    const n = exports.separateEnginPaths.cacheCocos;
    if (!u || !fs_extra_1.existsSync(n)) {
      var i = build_time_constants_1.setupBuildTimeConstants({
          mode: "BUILD",
          platform: "WECHAT",
          flags: { DEBUG: false },
        });

      var i = {
        platform: "WECHAT",
        engine: e,
        out: n,
        moduleFormat: ccBuild.ModuleOption.system,
        compress: true,
        ammoJsWasm: false,
        buildTimeConstants: i,
        split: true,
      };

      var r = path_1.join(t, "options.json");
      if (fs_extra_1.existsSync(r)) {
        var o = fs_extra_1.readJSONSync(r);
        if (require("lodash").isEqual(o, i)) {
          return n;
        }
      }
      fs_extra_1.emptyDirSync(t);
      const a = yield ccBuild.build(i);
      const s = {};

      yield Promise.all(
        Object.keys(a.exports).map(t => __awaiter(this, undefined, undefined, function* () {
          var e = calcCodeMd5(path_1.join(n, a.exports[t]));
          s[a.exports[t]] = e;
        })
        )
      );

      yield fs_extra_1.writeJSONSync(
        path_1.join(t, "meta.json"),
        Object.assign(a, { md5Map: s }),
        { spaces: 2 }
      );

      yield fs_extra_1.writeJSONSync(r, i, { spaces: 2 });
      (o = getWechatPluginFeatures(e));
      (r = path_1.join(t, "plugin"));
      yield generateCocos(
        enumerate_dependent_chunks_js_1.enumerateDependentChunks(a, o),
        r
      );
    }
    return n;
  });
}
function getWechatPluginFeatures(
  e = exports.separateEnginPaths.internalEngine
) {
  e = path_1.join(e, "editor", "engine-features", "render-config.json");
  if (!fs_extra_1.existsSync(e)) {
    throw new Error("render-config.json is not exist in engine!");
  }
  const n = fs_extra_1.readJSONSync(e).features;
  const i = [];
  function r(e, t) {
    if (e.wechatPlugin) {
      i.push(t);
    }
  }

  Object.keys(n).forEach((e) => {
    const t = n[e];

    if (t.options) {
      Object.keys(t.options).forEach(e => r(t.options[e], e));
    } else {
      r(t, e);
    }
  });

  return i;
}
function generateCocos(e, o) {
  return __awaiter(this, undefined, undefined, function* () {
    if (!e.length) {
      return [];
    }

    const i = fs_extra_1.readJSONSync(
        path_1.join(__dirname, "../static/cocos", "signature.json")
      );

    const r = fs_extra_1.readJSONSync(
      path_1.join(exports.separateEnginPaths.outDir, "meta.json")
    );

    fs_extra_1.ensureDirSync(o);

    yield Promise.all(
      e.map((n, e) => __awaiter(this, undefined, undefined, function* () {
        var e = path_1.join(exports.separateEnginPaths.cacheCocos, n);
        var t = path_1.join(o, n);

        if (r.md5Map[n]) {
          i.signature.push({ md5: r.md5Map[n], path: n });
        } else {
          yield outputSignatureMd5WithPath(i, e);
        }

        fs_extra_1.copyFileSync(e, t);
      })
      )
    );

    fs_extra_1.outputJSONSync(path_1.join(o, "signature.json"), i);

    fs_extra_1.copyFileSync(
      path_1.join(__dirname, "./../static/cocos/plugin.json"),
      path_1.join(o, "plugin.json")
    );

    return e;
  });
}
function querySignatureMd5() {}
function outputSignatureMd5WithPath(t, n) {
  return __awaiter(this, undefined, undefined, function* () {
    var e = calcCodeMd5(n);
    t.signature.push({ md5: e, path: path_1.basename(n) });
    return e;
  });
}
function calcCodeMd5(e) {
  return crypto_1
    .createHash("md5")
    .update(fs_extra_1.readFileSync(e))
    .digest("hex");
}

(exports.outDir = path_1.join(
  engineRoot,
  "bin/.cache/editor-cache/wechat-game"
));

(exports.separateEnginPaths = {
    internalEngine: engineRoot,
    outDir: exports.outDir,
    plugin: path_1.join(exports.outDir, "plugin"),
    cacheCocos: path_1.join(exports.outDir, "cocos"),
  });

(exports.buildCocos = buildCocos);
(exports.getWechatPluginFeatures = getWechatPluginFeatures);
(exports.generateCocos = generateCocos);
(exports.querySignatureMd5 = querySignatureMd5);
(exports.outputSignatureMd5WithPath = outputSignatureMd5WithPath);
(exports.calcCodeMd5 = calcCodeMd5);
