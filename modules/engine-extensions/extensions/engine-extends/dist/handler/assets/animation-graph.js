Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateMotionStateSpeed = migrateMotionStateSpeed;
const cc_1 = require("cc");
const new_gen_anim_1 = require("cc/editor/new-gen-anim");

const { migrateVariables } = require("./migrates/animation-graph/3.5.0");

const migration_utils_1 = require("./utils/migration-utils");

const { readFile } = require("fs-extra");

const { getDependUUIDList } = require("../utils");

const {
  migrateAnimationGraph_3_8_0,
} = require("./migrates/animation-graph/3.8.0");

const AnimationGraphHandler = {
  name: "animation-graph",
  assetType: cc_1.js.getClassName(new_gen_anim_1.AnimationGraph),
  open(e) {
    Editor.Message.send("animation-graph", "open", e.uuid);
    return true;
  },
  createInfo: {
    generateMenuInfo() {
      return [
        {
          label: "i18n:ENGINE.assets.newAnimationGraph",
          fullFileName: "Animation Graph.animgraph",
          template: `db://internal/default_file_content/${AnimationGraphHandler.name}/default.animgraph`,
          group: "animation",
        },
        {
          label: "i18n:ENGINE.assets.newAnimationGraphTS",
          fullFileName: "AnimationGraphComponent.ts",
          template: `db://internal/default_file_content/${AnimationGraphHandler.name}/ts-animation-graph`,
          handler: "typescript",
          group: "animation",
        },
      ];
    },
  },
  importer: {
    version: "1.2.0",
    async import(e) {
      var a = await readFile(e.source, "utf8");

      var a = (await e.saveToLibrary(".json", a), getDependUUIDList(a));

      e.setData("depends", a);
      return true;
    },
    migrationHook: migration_utils_1.migrationHook,
    migrations: [
      {
        version: "1.0.1",
        migrate: async (e) => {
          var e = e.getSwapSpace();
          var a = new migration_utils_1.Archive(e.json);
          var a = (migrateMotionStateSpeed(a), a.get());
          e.json = a;
        },
      },
      {
        version: "1.1.0",
        migrate: async (e) => {
          var e = e.getSwapSpace();
          var a = new migration_utils_1.Archive(e.json);
          var a = (migrateVariables(a), a.get());
          e.json = a;
        },
      },
      {
        version: "1.2.0",
        migrate: async (e) => {
          var e = e.getSwapSpace();
          var a = new migration_utils_1.Archive(e.json);
          var a = (migrateAnimationGraph_3_8_0(a), a.get());
          e.json = a;
        },
      },
    ],
  },
};

function migrateMotionStateSpeed(e) {
  e.visitTypedObject("cc.animation.Motion", (e) => {
    var a = e.speed.value;

    if (typeof a == "number") {
      e.speed = a;
    }
  });
}
exports.default = AnimationGraphHandler;
