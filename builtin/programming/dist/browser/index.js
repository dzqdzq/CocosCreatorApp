Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.load = load;
exports.unload = unload;
const browser_1 = require("../worker/browser");

const { load: load_2 } = browser_1;

const {
  generateCommonTsConfig,
  updateCustomMacro,
} = require("../intelligence");

const { querySharedSettings } = require("../shared/query-shared-settings");

async function load() {
  Editor.Message.__protected__.addBroadcastListener(
    "asset-db:ready",
    regenerateCommonTsConfig
  );

  Editor.Message.__protected__.addBroadcastListener(
    "asset-db:db-ready",
    regenerateCommonTsConfig
  );

  Editor.Message.__protected__.addBroadcastListener(
    "asset-db:db-close",
    regenerateCommonTsConfig
  );

  await load_2();
}
async function unload() {
  Editor.Message.__protected__.removeBroadcastListener(
    "asset-db:ready",
    regenerateCommonTsConfig
  );

  Editor.Message.__protected__.removeBroadcastListener(
    "asset-db:db-ready",
    regenerateCommonTsConfig
  );

  Editor.Message.__protected__.removeBroadcastListener(
    "asset-db:db-close",
    regenerateCommonTsConfig
  );
}
async function regenerateCommonTsConfig() {
  await generateCommonTsConfig();
}
exports.methods = {
  ...browser_1.methods,
  async "query-shared-settings"() {
    return querySharedSettings(console);
  },
  async "custom-macro-changed"() {
    await updateCustomMacro();
  },
  async querySortedPlugins(e = {}) {
    const o = await Editor.Message.request("asset-db", "query-assets", {
      ccType: "cc.Script",
      userData: { ...e, isPlugin: true },
    });
    if (!o.length) {
      return [];
    }
    o.sort((e, r) => e.name.localeCompare(r.name));
    e = await Editor.Profile.getProject("project", "script.sortingPlugin");

    if (Array.isArray(e) && e.length) {
      e.filter((r) => o.find((e) => e.uuid === r))
        .reverse()
        .reduce((e, r) => {
          var s;

          var t = o.findIndex((e) => e.uuid === r);

          return e < t ? ((s = o.splice(t, 1)), o.splice(e, 0, s[0]), e) : t;
        }, o.length);
    }

    return o.map((e) => ({
      uuid: e.uuid,
      file: e.library[".js"],
      url: e.url,
    }));
  },
};
