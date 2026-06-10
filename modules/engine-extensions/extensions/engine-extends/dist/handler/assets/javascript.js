Object.defineProperty(exports, "__esModule", { value: true });
exports.JavascriptHandler = undefined;
const asset_db_1 = require("@editor/asset-db");

const { readFile } = require("fs-extra");

const { transformPluginScript } = require("./utils/script-compiler");

const utils_1 = require("../utils");

const { i18nTranslate, linkToAssetTarget } = utils_1;

const migrateStep = new utils_1.MigrateStep();
async function _importPluginScript(e) {
  var i = await readFile(e.source, "utf-8");

  var {
    executionScope = "enclosed",
    experimentalHideCommonJs,
    experimentalHideAmd,
    simulateGlobals,
  } = e.userData;

  e.assignUserData(
    {
      isPlugin: true,
      loadPluginInEditor: false,
      loadPluginInWeb: true,
      loadPluginInMiniGame: true,
      loadPluginInNative: true,
    },
    false
  );

  if (executionScope === "global") {
    await e.saveToLibrary(".js", i);
  } else {
    executionScope =
      simulateGlobals === undefined
        ? ["self", "window", "global", "globalThis"]
        : simulateGlobals;

    simulateGlobals = await transformPluginScript(i, {
      simulateGlobals: executionScope,
      hideCommonJs: experimentalHideCommonJs ?? true,
      hideAmd: experimentalHideAmd ?? true,
    });

    await e.saveToLibrary(".js", simulateGlobals.code);
  }

  return true;
}

exports.JavascriptHandler = {
  name: "javascript",
  assetType: "cc.Script",
  open: utils_1.openCode,
  importer: {
    version: "4.0.24",
    migrations: [
      {
        version: "4.0.22",
        migrate(e) {
          var e_userData = e.userData;
          var e = e.userData;

          if (e_userData.simulateGlobals === true) {
            e.simulateGlobals = undefined;
          } else if (
            e_userData.simulateGlobals === false ||
            e_userData.simulateGlobals === undefined
          ) {
            e.simulateGlobals = [];
          }
        },
      },
      {
        version: "4.0.23",
        migrate(e) {
          e = e.userData;

          if (e.importAsPlugin !== undefined) {
            delete e.importAsPlugin;
          }
        },
      },
      {
        version: "4.0.24",
        async migrate(i) {
          var i_userData = i.userData;
          if (
            i_userData.isPlugin &&
            Array.isArray(i_userData.dependencies) &&
            i_userData.dependencies.length
          ) {
            await migrateStep.hold();
            var r = await Editor.Profile.getProject(
              "project",
              "script.sortingPlugin"
            );
            if (Array.isArray(r) && r.length && r.includes(i.uuid)) {
              var t = r.findIndex((e) => e === i.uuid);
              for (const a of i_userData.dependencies) {
                var s = r.findIndex((e) => e === a);

                if (-1 === s) {
                  r.splice(t, 0, a);
                } else if (t < s) {
                  r.splice(s, 1);
                  r.splice(t, 0, a);
                }
              }
            } else {
              for (const o of i_userData.dependencies) {
                if (!r.includes(o)) {
                  r.push(o);
                }
              }
              r.push(i.uuid);
            }

            await Editor.Profile.setProject(
              "project",
              "script.sortingPlugin",
              r
            );

            delete i.userData.dependencies;
            migrateStep.step();
          }
        },
      },
    ],
    async import(i) {
      if (!(i instanceof asset_db_1.Asset)) {
        console.error("Expect non-virtual asset");
        return false;
      }
      var i_userData = i.userData;
      try {
        return !i_userData.isPlugin || (await _importPluginScript(i));
      } catch (e) {
        console.error(
          i18nTranslate("engine-extends.importers.script.transform_failure", {
            path: i.source,
            reason: e,
          }),
          linkToAssetTarget(i.uuid)
        );

        return false;
      }
    },
  },
};

exports.default = exports.JavascriptHandler;
