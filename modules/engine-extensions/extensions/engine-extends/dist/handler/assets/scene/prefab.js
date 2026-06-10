Object.defineProperty(exports, "__esModule", { value: true });
exports.PrefabHandler = undefined;
const index_1 = require("./index");
const migrates_1 = require("./migrates");

const { readJSON, writeFile } = require("fs-extra");

const { removeNull, getDependList } = require("../../utils");

exports.PrefabHandler = {
  name: "prefab",
  assetType: "cc.Prefab",
  open(e) {
    return (
      !e._assetDB.options.readonly &&
      (Editor.Message.send("scene", "open-scene", e.uuid), true)
    );
  },
  createInfo: {
    generateMenuInfo() {
      return [
        {
          label: "i18n:ENGINE.assets.newPrefab",
          fullFileName: "Node.prefab",
          template: `db://internal/default_file_content/${exports.PrefabHandler.name}/default.prefab`,
          group: "scene",
        },
      ];
    },
  },
  importer: {
    version: index_1.version,
    versionCode: index_1.versionCode,
    migrations: migrates_1.migrations,
    migrationHook: {
      async pre(e) {
        e.getSwapSpace().json = await readJSON(e.source);
      },
      async post(e, r) {
        var t = e.getSwapSpace();

        if (r > 0) {
          r = JSON.stringify(t.json, null, 2);
          await writeFile(e.source, r);
        }

        delete t.json;
      },
    },
    async import(e) {
      var r = await readJSON(e.source);
      var t = e.basename || "";
      let a =
        r[0]._name !== t ||
        r[1]._name !== t ||
        r[0].persistent !== !!e.userData.persistent;

      if (a) {
        r[0]._name = t || "";
        r[1]._name = t || "";
        r[0].persistent = !!e.userData.persistent;
      }

      try {
        a = a || removeNull(r, e.uuid);
      } catch (e) {
        console.debug(e);
      }
      if (a) {
        try {
          const s = JSON.stringify(r, undefined, 2);
          await writeFile(e.source, s);
        } catch (e) {}
      }
      const s = JSON.stringify(r, undefined, 2);
      await e.saveToLibrary(".json", s);
      r = getDependList(s);
      e.setData("depends", r.uuids);
      e.setData("dependScripts", r.dependScriptUuids);
      e.userData.syncNodeName = t;
      return true;
    },
  },
};

exports.default = exports.PrefabHandler;
