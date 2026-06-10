Object.defineProperty(exports, "__esModule", { value: true });
const cc_1 = require("cc");
const new_gen_anim_1 = require("cc/editor/new-gen-anim");

const { readFile } = require("fs-extra");

const { getDependUUIDList } = require("../utils");

const AnimationGraphVariantHandler = {
  name: "animation-graph-variant",
  assetType: cc_1.js.getClassName(new_gen_anim_1.AnimationGraphVariant),
  createInfo: {
    generateMenuInfo() {
      return [
        {
          label: "i18n:ENGINE.assets.newAnimationGraphVariant",
          fullFileName: "Animation Graph Varint.animgraphvari",
          template: `db://internal/default_file_content/${AnimationGraphVariantHandler.name}/default.animgraphvari`,
          group: "animation",
        },
      ];
    },
  },
  importer: {
    version: "1.0.0",
    async import(a) {
      var e = await readFile(a.source, "utf8");

      var e = (await a.saveToLibrary(".json", e), getDependUUIDList(e));

      a.setData("depends", e);
      return true;
    },
  },
};

exports.default = AnimationGraphVariantHandler;
