var __createBinding =
    (this && this.__createBinding) ||
    (Object.create
      ? (t, e, i, o = i) => {
      Object.defineProperty(t, o, {
        enumerable: true,
        get() {
          return e[i];
        },
      });
    }
      : (t, e, i, o) => {
          t[(o = o === undefined ? i : o)] = e[i];
        });

var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? (t, e) => {
        Object.defineProperty(t, "default", { enumerable: true, value: e });
      }
    : (t, e) => {
        t.default = e;
      });

var __importStar =
  (this && this.__importStar) ||
  (t => {
    if (t && t.__esModule) {
      return t;
    }
    var e = {};
    if (t != null) {
      for (var i in t) {
        if (i !== "default" &&
          Object.prototype.hasOwnProperty.call(t, i)) {
          __createBinding(e, t, i);
        }
      }
    }
    __setModuleDefault(e, t);
    return e;
  });

var __awaiter =
  (this && this.__awaiter) ||
  ((t, u, a, s) => new (a = a || Promise)((i, e) => {
    function o(t) {
      try {
        r(s.next(t));
      } catch (t) {
        e(t);
      }
    }
    function n(t) {
      try {
        r(s.throw(t));
      } catch (t) {
        e(t);
      }
    }
    function r(t) {
      var e;

      if (t.done) {
        i(t.value);
      } else {
        ((e = t.value) instanceof a
              ? e
              : new a(t => {
                  t(e);
                })
            ).then(o, n);
      }
    }
    r((s = s.apply(t, u || [])).next());
  }));

Object.defineProperty(exports, "__esModule", { value: true });

exports.outputSignatureMd5WithCode = undefined;
exports.outputSignatureMd5WithPath = undefined;
exports.buildCocos = undefined;

const ccBuild = __importStar(require("@cocos/build-engine"));
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const crypto_1 = require("crypto");
const build_time_constants_1 = require("@cocos/build-engine/dist/build-time-constants");
function buildCocos() {
  return __awaiter(this, undefined, undefined, function* () {
    var t = path_1.join(Editor.App.path, "../resources/3d/engine");
    var e = path_1.join(t, "bin/.cache/editor-cache/oppo-mini-game");

    var i = build_time_constants_1.setupBuildTimeConstants({
      mode: "BUILD",
      platform: "OPPO",
      flags: { DEBUG: false, UI_GPU_DRIVEN: false },
    });

    const o = path_1.join(e, "cocos");

    (t = {
      platform: "OPPO",
      engine: t,
      out: o,
      moduleFormat: ccBuild.ModuleOption.system,
      compress: true,
      split: true,
      ammoJsWasm: false,
      buildTimeConstants: i,
    });

    (i = path_1.join(e, "options.json"));
    if (fs_extra_1.existsSync(i)) {
      var n = fs_extra_1.readJSONSync(i);
      if (require("lodash").isEqual(n, t)) {
        return e;
      }
    }
    fs_extra_1.emptyDirSync(e);
    const r = yield ccBuild.build(t);
    const u = {};

    yield Promise.all(
      Object.keys(r.exports).map(e => __awaiter(this, undefined, undefined, function* () {
        var t = yield outputSignatureMd5WithPath(
          path_1.join(o, r.exports[e])
        );
        u[r.exports[e]] = t;
      })
      )
    );

    yield fs_extra_1.writeJSONSync(
      path_1.join(e, "meta.json"),
      Object.assign(r, { md5Map: u }),
      { spaces: 2 }
    );

    fs_extra_1.outputJSONSync(i, t, { spaces: 4 });
    return e;
  });
}
function outputSignatureMd5WithPath(t) {
  return __awaiter(this, undefined, undefined, function* () {
    return outputSignatureMd5WithCode(fs_extra_1.readFileSync(t));
  });
}
function outputSignatureMd5WithCode(t) {
  return __awaiter(this, undefined, undefined, function* () {
    return crypto_1.createHash("md5").update(t).digest("hex");
  });
}
(exports.buildCocos = buildCocos);
(exports.outputSignatureMd5WithPath = outputSignatureMd5WithPath);
(exports.outputSignatureMd5WithCode = outputSignatureMd5WithCode);
