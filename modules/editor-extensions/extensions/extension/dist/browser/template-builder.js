Object.defineProperty(exports, "__esModule", { value: true });
exports.createExtensionTemplate = undefined;
const electron_1 = require("electron");

const { getExtensionInfoMap } = require("./contribution");

const {
  getAuthor,
  getFallbackExtensionName,
  isExtensionNameError,
  getEditorVersion,
  isEditorVersionError,
  getExtensionDist,
} = require("../public/utils-build");

const { join, normalize } = require("path");

const { readJSON, outputJSON, ensureDir } = require("fs-extra");

const { createFromCli } = require("./template-from-cli-create");

const createExtensionTemplate = async (e, t) => {
  const { type, templateId } = e;
  var r = getExtensionInfoMap();
  const a = { success: false, msg: "", stack: "" };
  if (!Reflect.has(r, type) || !r[type]?.templates) {
    a.success = false;
    a.msg = `template type ${type} is not found`;
    return a;
  }
  r = r[type].templates?.find((e) => e.id === templateId);
  if (!r || !r.creator) {
    a.success = false;
    a.msg = `template ${r?.name} is not valid`;
    return a;
  }

  var o = e.author || (await getAuthor()) || "Cocos Creator Developer";

  var n = e.name || getFallbackExtensionName();
  if (isExtensionNameError(n)) {
    a.success = false;
    a.msg = `name ${n} is not valid`;
    return a;
  }
  var c = e.editorVersion || getEditorVersion();
  if (isEditorVersionError(c)) {
    a.success = false;
    a.msg = `editor version limit ${c} is not valid`;
    return a;
  }
  try {
    var l = {
      baseTemplate: join(__dirname, "../../static/extension-template/template"),
      dist: e.dist || getExtensionDist(n),
    };
    if (r.isFromCLI) {
      await createFromCli({
        author: o,
        name: n,
        dist: l.dist,
        editorVersion: c,
        template: r,
      })
        .then(() => {
          a.success = true;
        })
        .catch((e) => {
          a.success = false;
          a.msg = e.message;
        });

      if (
        a.success &&
        (t && Editor.Package.register(l.dist), e.showInFolder) &&
        e.dist
      ) {
        electron_1.shell.showItemInFolder(e.dist);
      }
    } else {
      var d = normalize(r.creator);
      var p = !!require.cache[d];
      var u = require(d);

      if (!p && u.load) {
        u.load();
      }

      await Editor.Utils.File.copy(l.baseTemplate, l.dist);
      await Editor.Utils.File.copy(r.path, l.dist);
      try {
        var m;
        var _ = join(l.dist, "package.json");
        var h = await readJSON(_);
        const f = {
          $schema: "./@types/schema/package/index.json",
          package_version: 2,
          name: n,
          version: "1.0.0",
          author: o,
          editor: c,
          scripts: {
            preinstall: "node ./scripts/preinstall.js",
            build: "npx tsc",
          },
        };
        for (const E in h) {
          f[E] = f[E] || h[E];
        }
        if (h.scripts) {
          for (const v in h.scripts) {
            f.scripts[v] = h.scripts[v];
          }
        }
        if (!r.path) {
          m = Editor.I18n.t("extension.create_package.no_path_warning", {
            template: r.name,
          });

          throw new Error(m);
        }
        await u.methods.create(
          { author: o, name: n, dist: l.dist, editorVersion: c, template: r },
          f
        );
        const x = f.devDependencies || {};
        x["@cocos/creator-types"] = "^" + Editor.App.version;
        x["@types/node"] = "^18.17.1";
        x.typescript = "^5.8.2";
        f.devDependencies = {};

        Object.keys(x)
          .sort()
          .forEach((e) => {
            f.devDependencies[e] = x[e];
          });

        await outputJSON(_, f, { spaces: 4 });
        var g = join(l.dist, "node_modules");
        await ensureDir(g);
        await Editor.Message.request("utils", "export-dts", g, false);
        a.success = true;
      } catch (e) {
        a.success = false;

        if (e instanceof Error) {
          a.msg = e.message;
          a.stack = e.stack || "";
        } else {
          a.msg = "create extension template fail";
        }

        return a;
      }

      if (a.success) {
        t && (await Editor.Package.register(l.dist));

        e.showInFolder && e.dist && electron_1.shell.showItemInFolder(e.dist);
      } else {
        a.msg = "create extension template fail";
      }
    }
    return a;
  } catch (e) {
    if (e instanceof Error) {
      a.msg = e.message;
      a.stack = e.stack || "";
    } else {
      a.msg = "create extension template fail";
    }

    a.success = false;
    return a;
  }
};

exports.createExtensionTemplate = createExtensionTemplate;
