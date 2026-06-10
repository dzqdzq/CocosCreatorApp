var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeScriptHandler = undefined;

const {
  existsSync,
  outputFileSync,
  readdirSync,
  statSync,
  readFile,
} = require("fs-extra");

const { join, basename, extname } = require("path");

const utils_1 = require("../utils");
const javascript_1 = __importDefault(require("./javascript"));
const ts_utils_1 = require("./utils/ts-utils");
async function getTypeCheckLevel() {
  return await Editor.Profile.getProject("project", "general.type_check_level");
}

exports.TypeScriptHandler = {
  name: "typescript",
  assetType: "cc.Script",
  open: utils_1.openCode,
  createInfo: {
    async generateMenuInfo() {
      let e = [
        {
          label: "i18n:ENGINE.assets.newTypeScript",
          fullFileName:
            ts_utils_1.ScriptNameChecker.getDefaultClassName() + ".ts",
          template: `db://internal/default_file_content/${exports.TypeScriptHandler.name}/ts`,
          group: "script",
          fileNameCheckConfigs: [ts_utils_1.DefaultScriptFileNameCheckConfig],
        },
      ];

      const a = join(Editor.Project.path, ".creator/asset-template/typescript");

      const s = "Custom Script Template Help Documentation.url";
      var t = join(a, s);

      if (!existsSync(t)) {
        outputFileSync(
          t,
          "[InternetShortcut]\nURL=https://docs.cocos.com/creator/manual/en/scripting/setup.html#custom-script-template"
        );
      }

      if (existsSync(a)) {
        t = readdirSync(a);
        const r = [];

        t.forEach((e) => {
          var t = join(a, e);

          if (!statSync(t).isDirectory() && e !== s && !e.startsWith(".")) {
            e = basename(e, extname(e));

            r.push({
              label: e,
              fullFileName:
                (ts_utils_1.ScriptNameChecker.getValidClassName(e) ||
                  ts_utils_1.ScriptNameChecker.getDefaultClassName()) + ".ts",
              template: t,
              fileNameCheckConfigs: [
                ts_utils_1.DefaultScriptFileNameCheckConfig,
              ],
            });
          }
        });

        if (r.length) {
          r.splice(0, 0, e[0]);
          r[0].fullFileName =
            ts_utils_1.ScriptNameChecker.getDefaultClassName() + ".ts";

          e = [
            {
              label: "i18n:ENGINE.assets.newTypeScript",
              group: "script",
              submenu: r,
            },
          ];

          r.push({
            label: Editor.I18n.t("assets.menu.setCustomTypeScript"),
            message: {
              target: "asset-db",
              name: "show-asset-template-dir",
              params: [a],
            },
          });
        }
      }

      return e;
    },
    async create(e) {
      var t = Manager.Utils.url2path(
        e.template || "db://internal/default_file_content/ts"
      );
      let a = await readFile(t, "utf-8");
      a = a.replace(ts_utils_1.ScriptNameChecker.commentsReg, (e) =>
        e.includes("COMMENTS_GENERATE_IGNORE") ? "" : e
      );
      var t = basename(e.target, extname(e.target));
      var s = await ts_utils_1.ScriptNameCheckerManager.getScriptChecker(a);
      var r = await Editor.User.getData();
      const l = {
        Name: ts_utils_1.ScriptNameChecker.getValidClassName(t),
        UnderscoreCaseClassName:
          ts_utils_1.ScriptNameChecker.getValidClassName(t),
        CamelCaseClassName: s.getValidCamelCaseClassName(t),
        DateTime: new Date().toString(),
        Author: r.nickname,
        FileBasename: basename(e.target),
        FileBasenameNoExtension: t,
        URL: Manager.assetManager.queryUrl(e.target),
        EditorVersion: Editor.App.version,
        ManualUrl: Editor.App.urls.manual,
      };
      r = s.classNameStringFormat.substring(
        2,
        s.classNameStringFormat.length - 2
      );
      if (r in l) {
        let e = l[r];

        if (
          (!e || !ts_utils_1.ScriptNameChecker.invalidClassNameReg.test(e)) &&
          !((l.DefaultCamelCaseClassName =
            l.CamelCaseClassName ||
            ts_utils_1.ScriptNameChecker.getDefaultClassName()),
          ts_utils_1.ScriptNameChecker.invalidClassNameReg.test(e) ||
            (a = (a = a.replace(
              `@ccclass('<%${r}%>')`,
              "@ccclass('<%DefaultCamelCaseClassName%>')"
            )).replace(
              `class <%${r}%>`,
              "class <%DefaultCamelCaseClassName%>"
            )),
          (e = l.DefaultCamelCaseClassName),
          l.CamelCaseClassName)
        ) {
          console.warn(
            Editor.I18n.t(
              "engine-extends.importers.script.findClassNameFromFileNameFailed",
              { fileBasename: t, className: e }
            )
          );
        }

        if (!l.CamelCaseClassName) {
          l.Name || (l.Name = e);
          l.CamelCaseClassName = e;
        }
      }

      Object.keys(l).forEach((e) => {
        a = a.replace(new RegExp(`<%${e}%>`, "g"), l[e]);
      });

      outputFileSync(e.target, a, "utf-8");
      return e.target;
    },
    preventDefaultTemplateMenu: true,
  },
  importer: {
    ...javascript_1.default.importer,
    async import(e) {
      if (e.source.endsWith(".d.ts")) {
        return true;
      }
      let t = false;
      let a = false;
      switch (await getTypeCheckLevel()) {
        case "checkOnly": {
          t = true;
          a = false;
          break;
        }
        case "fatalOnError": {
          t = true;
          a = true;
          break;
        }
        default: {
          t = false;
        }
      }
      return javascript_1.default.importer.import(e);
    },
  },
};

exports.default = exports.TypeScriptHandler;
