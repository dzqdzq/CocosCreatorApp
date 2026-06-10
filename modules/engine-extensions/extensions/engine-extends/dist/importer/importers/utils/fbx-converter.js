var FbxGlTfConvLogLevel;

var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, r, o = r) => {
        Object.defineProperty(e, o, {
          enumerable: true,
          get() {
            return t[r];
          },
        });
      }
    : (e, t, r, o) => {
        e[(o = o === undefined ? r : o)] = t[r];
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

var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));

Object.defineProperty(exports, "__esModule", { value: true });
exports.createFbxConverter = undefined;
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importStar(require("fs-extra"));
const child_process_1 = __importDefault(require("child_process"));
const utils_1 = require("../../utils");
function createFbxConverter(l) {
  const u = "out.gltf";
  let f = require("@editor/fbx-gltf-conv").tool;
  var e = f.replace("app.asar", "app.asar.unpacked");

  if (fs_extra_1.default.existsSync(e)) {
    f = e;
  }

  return {
    get options() {
      return l;
    },
    get(e, t) {
      return path_1.default.join(t, u);
    },
    async convert(e, t) {
      var a;
      var s;
      var i;
      var r = [];

      var e =
        (r.push(c(e.source)),
        r.push(
          "--unit-conversion",
          null != (e = l.unitConversion) ? e : "geometry-level"
        ),
        r.push(
          "--animation-bake-rate",
          "" + (null != (e = l.animationBakeRate) ? e : 0)
        ),
        r.push(
          "--prefer-local-time-span=" +
            (null == (e = l.preferLocalTimeSpan) || e)
        ),
        null != (e = l.smartMaterialEnabled) &&
          e &&
          (r.push("--export-fbx-file-header-info"),
          r.push("--export-raw-materials")),
        path_1.default.join(t, u));

      await fs_extra_1.default.ensureDir(path_1.default.dirname(e));
      r.push("--out", c(e));
      var o = path_1.default.join(t, ".fbm");

      var o =
        (await fs_extra_1.default.ensureDir(o),
        r.push("--fbm-dir", c(o)),
        v(t));

      await fs_extra_1.default.ensureDir(path_1.default.dirname(o));
      r.push("--log-file", c(o));
      a = f;
      s = r;
      i = t;
      let n = await new Promise((t, e) => {
        var r = child_process_1.default.spawn(c(a), s, { cwd: i, shell: true });
        let o = "";

        if (r.stdout) {
          r.stdout.on("data", (e) => (o += e));
        }

        let n = "";

        if (r.stderr) {
          r.stderr.on("data", (e) => (n += e));
        }

        r.on("error", e);

        r.on("close", (e) => {
          if (o) {
            console.log(o);
          }

          if (n) {
            console.error(n);
          }

          if (e === 0) {
            t(true);
          } else {
            e !== 1 &&
              (e === 3221225781
                ? console.error(
                    Editor.I18n.t(
                      "asset-db.importers.fbx.fbxGlTfConv.missing_dll"
                    )
                  )
                : console.error(
                    "FBX-glTF-conv existed with unexpected non-zero code " + e
                  ));

            t(false);
          }
        });
      });

      if (n && !(await fs_extra_1.pathExists(e))) {
        n = false;

        console.error(
          `Tool FBX-glTF-conv ends abnormally(spawn ${f} ${r.join(" ")}).`
        );
      }

      return n;
    },
    async printLogs(t, r) {
      r = v(r);
      if (await fs_extra_1.pathExists(r)) {
        let e;
        try {
          e = await fs_extra_1.default.readJson(r);
        } catch (e) {
          console.debug("No logs are generated, it should not happen indeed.");
        }
        if (Array.isArray(e)) {
          try {
            var o;
            var n;
            var a;
            var s = e;
            var i = t;

            var l = (e) => {
              let r;
              switch (e) {
                case FbxGlTfConvLogLevel.verbose: {
                  r = console.debug;
                  break;
                }
                case FbxGlTfConvLogLevel.info: {
                  r = console.log;
                  break;
                }
                case FbxGlTfConvLogLevel.warning: {
                  r = console.warn;
                  break;
                }
                case FbxGlTfConvLogLevel.error:
                case FbxGlTfConvLogLevel.fatal:
                default: {
                  r = console.error;
                }
              }
              return (e) => {
                var t;
                r(((t = i), `${e} [${utils_1.linkToAssetTarget(t.uuid)}]`));
              };
            };

            var u = "unsupported_inherit_type";
            var f = {};
            for ({ level: _, message: o } of s) {
              var c;
              var d;
              var p;
              var _ = l(_);

              if (typeof o == "string") {
                _(o);
              } else if ((c = o.code) === u) {
                d = o.type;
                p = o.node;
                d in f || (f[d] = []);
                f[d].push(p);
              } else {
                _(
                  typeof c == "string"
                    ? b(c, o)
                    : JSON.stringify(o, undefined, 2)
                );
              }
            }
            for ([n, a] of Object.entries(f)) {
              l(FbxGlTfConvLogLevel.verbose)(b(u, { type: n, nodes: a }));
            }
          } catch (e) {
            console.error(e);
          }
        }
      }
    },
  };

  function c(e) {
    return `"${e}"`;
  }
  function v(e) {
    return path_1.default.join(e, "log.json");
  }
  function b(e, t) {
    return Editor.I18n.t("asset-db.importers.fbx.fbxGlTfConv." + e, t);
  }
}
exports.createFbxConverter = createFbxConverter;

((e) => {
  e[(e.verbose = 0)] = "verbose";
  e[(e.info = 1)] = "info";
  e[(e.warning = 2)] = "warning";
  e[(e.error = 3)] = "error";
  e[(e.fatal = 4)] = "fatal";
})((FbxGlTfConvLogLevel = FbxGlTfConvLogLevel || {}));
