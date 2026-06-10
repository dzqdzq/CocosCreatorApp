var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, r, n = r) => {
        var o = Object.getOwnPropertyDescriptor(t, r);

        if (
          !o ||
          (!("get" in o) ? !o.writable && !o.configurable : t.__esModule)
        ) {
          o = {
            enumerable: true,
            get() {
              return t[r];
            },
          };
        }

        Object.defineProperty(e, n, o);
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
    var o = (e) =>
      (o =
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
        for (var r = o(e), n = 0; n < r.length; n++) {
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
exports.registerMacroConfig = registerMacroConfig;

const { join } = require("path");

const ts = __importStar(require("typescript"));

const { existsSync, readFileSync } = require("fs");

const type2UI = {
  string: "ui-input",
  number: "ui-num-input",
  boolean: "ui-checkbox",
};

const ReadonlyKeyList = [
  "SUPPORT_TEXTURE_FORMATS",
  "KEY",
  "RAD",
  "DEG",
  "FLT_EPSILON",
  "ORIENTATION_PORTRAIT",
  "ORIENTATION_PORTRAIT_UPSIDE_DOWN",
  "ORIENTATION_LANDSCAPE",
  "ORIENTATION_LANDSCAPE_LEFT",
  "ORIENTATION_LANDSCAPE_RIGHT",
  "ORIENTATION_AUTO",
  "REPEAT_FOREVER",
  "CUSTOM_PIPELINE_NAME",
];

async function registerMacroConfig(e) {
  const n = (
    await Promise.resolve().then(() => __importStar(require("cc/editor/macro")))
  ).macro;
  var t = Editor.Package.getPackages({ name: "engine" });
  if (!(t.length <= 0)) {
    t = t[0];
    if (t.info.contributions) {
      var r;
      var e = join(e, "cocos/core/platform/macro.ts");
      const o = {};
      const i = {};
      const a = {};
      try {
        if (existsSync(e)) {
          (r = ts
            .createSourceFile(
              e,
              readFileSync(e).toString(),
              ts.ScriptTarget.Latest,
              true
            )
            .statements.find(
              (e) =>
                ts.isInterfaceDeclaration(e) && e.name.escapedText === "Macro"
            )) &&
            r.members
              .filter(
                (e) =>
                  e.jsDoc?.length &&
                  ["en", "zh"].every((t) =>
                    e.jsDoc[0].tags.some((e) => e.tagName.escapedText === t)
                  )
              )
              .forEach((e) => {
                var t = e.jsDoc[0].tags;

                o[e.name.escapedText] = {
                  en: t.find((e) => e.tagName.escapedText === "en").comment,
                  zh: t.find((e) => e.tagName.escapedText === "zh").comment,
                };

                i[e.name.escapedText] = o[e.name.escapedText].en;
                a[e.name.escapedText] = o[e.name.escapedText].zh;
              });

          Editor.I18n.__protected__.register("en", "engine_macro", i);
          Editor.I18n.__protected__.register("zh", "engine_macro", a);
        }
      } catch (e) {
        console.error(e);
      }
      const c = t.info.contributions.project.macroConfig;
      c.content = {};
      const s = {};
      const f = {};

      Object.keys(n).forEach((e) => {
        var t;
        var r;

        if (!ReadonlyKeyList.includes(e)) {
          t = n[e];

          ["string", "number", "boolean"].includes((r = typeof t)) &&
            ((s["macroConfig." + e] = {
              label: e,
              default: t,
              description: "i18n:engine_macro." + e,
            }),
            (f[e] = t),
            (c.content["macroConfig." + e] = { ui: type2UI[r] }));
        }
      });

      await Editor.Profile.setProject("engine", "macroConfig", f, "default");

      if (!t.info.contributions.profile.project) {
        t.info.contributions.profile.project = {};
      }

      Object.assign(t.info.contributions.profile.project, s);
      t.info.contributions.project.macroConfig = c;
    }
  }
}
