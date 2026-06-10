Object.defineProperty(exports, "__esModule", { value: true });
exports.JavascriptImporter = undefined;
const asset_db_1 = require("@editor/asset-db");
const fs_extra_1 = require("fs-extra");
const script_compiler_1 = require("./utils/script-compiler");
const utils_1 = require("../utils");
class JavascriptImporter extends asset_db_1.Importer {
  constructor(e) {
    super(e);
  }
  get version() {
    return "4.0.23";
  }
  get name() {
    return "javascript";
  }
  get assetType() {
    return "cc.Script";
  }
  get migrations() {
    return [
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
    ];
  }
  async import(r) {
    if (!(r instanceof asset_db_1.Asset)) {
      console.error("Expect non-virtual asset");
      return false;
    }
    var r_userData = r.userData;
    try {
      return !r_userData.isPlugin || (await this._importPluginScript(r));
    } catch (e) {
      console.error(
        utils_1.i18nTranslate(
          "asset-db.importers.javascript.transform_failure",
          { path: r.source, reason: e }
        ),
        utils_1.linkToAssetTarget(r.uuid)
      );

      return false;
    }
  }
  async _importPluginScript(e) {
    var r = await fs_extra_1.readFile(e.source, "utf-8");

    var {
      executionScope = "enclosed",
      experimentalHideCommonJs,
      experimentalHideAmd,
      simulateGlobals,
    } = e.userData;

    if (executionScope === "global") {
      await e.saveToLibrary(".js", r);
    } else {
      executionScope =
        simulateGlobals === undefined
          ? ["self", "window", "global", "globalThis"]
          : simulateGlobals;

      simulateGlobals = await script_compiler_1.transformPluginScript(r, {
        simulateGlobals: executionScope,
        hideCommonJs:
          experimentalHideCommonJs == null || experimentalHideCommonJs,
        hideAmd: experimentalHideAmd == null || experimentalHideAmd,
      });

      await e.saveToLibrary(".js", simulateGlobals.code);
    }

    return true;
  }
}
exports.JavascriptImporter = JavascriptImporter;
