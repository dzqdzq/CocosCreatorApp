var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, i, r = i) => {
        var a = Object.getOwnPropertyDescriptor(t, i);

        if (
          !a ||
          (!("get" in a) ? !a.writable && !a.configurable : t.__esModule)
        ) {
          a = {
            enumerable: true,
            get() {
              return t[i];
            },
          };
        }

        Object.defineProperty(e, r, a);
      }
    : (e, t, i, r) => {
        e[(r = r === undefined ? i : r)] = t[i];
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
          var i = [];
          for (t in e) {
            if (Object.prototype.hasOwnProperty.call(e, t)) {
              i[i.length] = t;
            }
          }
          return i;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var t = {};
      if (e != null) {
        for (var i = a(e), r = 0; r < i.length; r++) {
          if (i[r] !== "default") {
            __createBinding(t, e, i[r]);
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
exports.name = undefined;
exports.title = undefined;
exports.handle = handle;
const ejs_1 = __importDefault(require("ejs"));

const { outputFileSync } = require("fs-extra");

const { join } = require("path");

const babel = __importStar(require("@babel/core"));
const preset_env_1 = __importDefault(require("@babel/preset-env"));

const { relativeUrl, toBabelModules } = require("../../utils");

const APPLICATION_EJS_VERSION = "1.0.0";
async function handle(e, t, i) {
  var r = JSON.stringify(t.settings, null, e.debug ? 4 : 0);

  var r =
    (outputFileSync(t.paths.settings, r, "utf8"),
    (await Editor.Message.request("engine", "query-engine-info")).typescript
      .path);

  var r = join(r, "templates/launcher");

  var a = this.buildTemplate.query("application") || join(r, "application.ejs");

  var s = relativeUrl(t.paths.dir, t.paths.settings);

  var a = await ejs_1.default.renderFile(
    a,
    Object.assign(e.appTemplateData, {
      settingsJsonPath: s,
      hasPhysicsAmmo:
        e.buildEngineParam.includeModules.includes("physics-ammo"),
      versionTips: Editor.I18n.t("builder.tips.applicationEjsVersion"),
      customVersion: APPLICATION_EJS_VERSION,
      versionCheckTemplate: join(r, "version-check.ejs"),
    })
  );

  var s = await babel.transformAsync(a, {
    presets: [
      [
        preset_env_1.default,
        {
          modules: toBabelModules("systemjs"),
          targets: e.buildScriptParam.targets,
        },
      ],
    ],
  });

  if (!s || !s.code) {
    throw new Error("无法生成 application.js");
  }
  outputFileSync(t.paths.applicationJS, s.code);

  e.md5CacheOptions.includes.push(
    Editor.Utils.Path.relative(t.paths.dir, t.paths.applicationJS)
  );
}
exports.title = "i18n:builder.tasks.build_template";
exports.name = "build-task/template";
