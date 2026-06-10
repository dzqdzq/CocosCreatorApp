Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneHandler = undefined;
exports.versionCode = undefined;
exports.version = undefined;
const migrates_1 = require("./migrates");

const { readJSON, writeFile } = require("fs-extra");

const { basename, extname } = require("path");

const { removeNull, getDependList } = require("../../utils");

const migration_utils_1 = require("../utils/migration-utils");
function changeSceneUuid(e, t) {
  return e[1]._id !== t && ((e[1]._id = t), true);
}
async function queryDefaultTemplateURL() {
  var e = "db://internal/default_file_content/scene";
  let t = e + "/default.scene";
  var r =
    (await Editor.Message.request("engine", "query-engine-modules-profile"))
      ?.includeModules || [];

  if (r && !r.includes("3d")) {
    t = e + "/scene-2d.scene";
  } else if (
    await Editor.Profile.getProject("project", "general.highQuality")
  ) {
    t = e + "/scene-quality.scene";
  }

  return t;
}
exports.version = "1.1.50";
exports.versionCode = 2;

exports.SceneHandler = {
  name: "scene",
  assetType: "cc.SceneAsset",
  open(e) {
    return (
      !e._assetDB.options.readonly &&
      (Editor.Message.send("scene", "open-scene", e.uuid), true)
    );
  },
  createInfo: {
    async generateMenuInfo() {
      var e = await queryDefaultTemplateURL();
      return [
        {
          label: "i18n:ENGINE.assets.newScene",
          fullFileName: e.endsWith("default.scene")
            ? "scene.scene"
            : basename(e),
          template: e,
          group: "scene",
        },
      ];
    },
  },
  customOperationMap: {
    queryDefaultContent: {
      async operator() {
        var e = await queryDefaultTemplateURL();
        var e = await readJSON(Manager.Utils.url2path(e));
        await changeSceneUuid(e, Editor.Utils.UUID.generate(false));
        return e;
      },
    },
  },
  importer: {
    version: exports.version,
    versionCode: exports.versionCode,
    migrations: migrates_1.migrations,
    migrationHook: migration_utils_1.migrationHook,
    async import(e) {
      var t = await readJSON(e.source);
      var r = basename(e.source, extname(e.source));
      let a = t[0]._name !== r;

      if (a) {
        t[0]._name = r;
      }

      try {
        a = a || removeNull(t, e.uuid);
      } catch (e) {
        console.debug(e);
      }

      if ((a = changeSceneUuid(t, e.uuid) || a)) {
        r = JSON.stringify(t, undefined, 2);
        await writeFile(e.source, r);
      }

      r = JSON.stringify(t, undefined, 2);
      await e.saveToLibrary(".json", r);
      t = getDependList(r);
      r = t.uuids.indexOf(e.uuid);

      if (-1 !== r) {
        t.uuids.splice(r, 1);
      }

      e.setData("depends", t.uuids);
      e.setData("dependScripts", t.dependScriptUuids);
      return true;
    },
  },
};

exports.default = exports.SceneHandler;
