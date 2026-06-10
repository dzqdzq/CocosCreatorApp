Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateMotionStateSpeed = undefined;
exports.AnimationGraphImporter = undefined;
const asset_db_1 = require("@editor/asset-db");
const cc_1 = require("cc");
const new_gen_anim_1 = require("cc/editor/new-gen-anim");
const _3_5_0_1 = require("./migrates/animation-graph/3.5.0");
const migrates_1 = require("./scene/migrates");
const migration_utils_1 = require("./utils/migration-utils");
const fs_extra_1 = require("fs-extra");
const utils_1 = require("../utils");
class AnimationGraphImporter extends asset_db_1.Importer {
  get version() {
    return "1.1.0";
  }
  get name() {
    return "animation-graph";
  }
  get assetType() {
    return cc_1.js.getClassName(new_gen_anim_1.AnimationGraph);
  }
  async import(e) {
    var t = await fs_extra_1.readFile(e.source, "utf8");
    var t = (await e.saveToLibrary(".json", t), utils_1.getDependUUIDList(t));
    e.setData("depends", t);
    return true;
  }
  get migrationHook() {
    return migrates_1.migrationHook;
  }
  get migrations() {
    return [
      {
        version: "1.0.1",
        migrate: async (e) => {
          var e = e.getSwapSpace();
          var t = new migration_utils_1.Archive(e.json);
          var t = (migrateMotionStateSpeed(t), t.get());
          e.json = t;
        },
      },
      {
        version: "1.1.0",
        migrate: async (e) => {
          var e = e.getSwapSpace();
          var t = new migration_utils_1.Archive(e.json);
          var t = (_3_5_0_1.migrateVariables(t), t.get());
          e.json = t;
        },
      },
    ];
  }
}
function migrateMotionStateSpeed(e) {
  e.visitTypedObject("cc.animation.Motion", (e) => {
    var t = e.speed.value;

    if (typeof t == "number") {
      e.speed = t;
    }
  });
}
exports.AnimationGraphImporter = AnimationGraphImporter;
exports.migrateMotionStateSpeed = migrateMotionStateSpeed;
