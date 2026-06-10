Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateCreatorAndTemplates = migrateCreatorAndTemplates;

const { existsSync, ensureDir, move, remove, symlink } = require("fs-extra");

const { join } = require("path");

async function migrateCreatorAndTemplates() {
  var t = await Editor.Project.__protected__.getLastEditorVersion();

  if (!t || !Editor.Utils.Parse.compareVersion(t, "3.8.2")) {
    (await migrateCreatorFolder()) &&
      Editor.Task.addNotice({
        title: Editor.I18n.t("asset-db.migrations.creator.autoTitle"),
        message:
          Editor.I18n.t("asset-db.migrations.creator.message") +
          Editor.I18n.t("asset-db.migrations.creator.autoMessage"),
        source: "asset-db",
        type: "success",
      });

    (await migrateTemplateFolder())
      ? Editor.Task.addNotice({
          title: Editor.I18n.t("asset-db.migrations.templates.autoTitle"),
          message:
            Editor.I18n.t("asset-db.migrations.templates.message") +
            Editor.I18n.t("asset-db.migrations.templates.autoMessage"),
          source: "builder",
          type: "success",
        })
      : Editor.Task.addNotice({
          title: Editor.I18n.t("asset-db.migrations.templates.title"),
          message: Editor.I18n.t("asset-db.migrations.templates.message"),
          source: "builder",
          type: "success",
        });
  }
}
async function migrateCreatorFolder() {
  var e = join(Editor.Project.path, "templates");
  var a = join(Editor.Project.path, ".creator");
  if (existsSync(a)) {
    let t = false;
    try {
      var r;
      var s;
      var i = join(a, "default-meta.json");

      if (existsSync(i)) {
        t = true;
        r = join(Editor.Project.path, "settings", "default-meta.json");

        existsSync(r)
          ? console.warn(r + " have already exist!")
          : (await ensureDir(join(Editor.Project.path, "settings")),
            await move(i, r));
      }

      var o = join(a, "asset-template");

      if (existsSync(o)) {
        t = true;
        s = join(e, "new-asset");

        existsSync(s)
          ? console.warn(s + " have already exist!")
          : (await ensureDir(e), await move(o, s));
      }

      await remove(a);
    } catch (t) {
      console.error(t);
      console.error("migrate .creator folder failed!");
    }
    return t;
  }
  return false;
}
async function migrateTemplateFolder() {
  var t = join(Editor.Project.path, "preview-template");
  var e = join(Editor.Project.path, "build-templates");
  var a = join(Editor.Project.path, "templates");
  let r = false;
  try {
    var s = join(a, "browser-preview");

    if (existsSync(t) && !existsSync(s)) {
      r = true;
      await ensureDir(a);
      await move(t, s);
      await symlink(s, t);
    }
  } catch (t) {
    console.error(t);
  }
  try {
    var i = join(a, "build");

    if (existsSync(e) && !existsSync(i)) {
      r = true;
      await ensureDir(a);
      await move(e, i);
      await symlink(i, e);
    }
  } catch (t) {
    console.error(t);
  }
  return r;
}
