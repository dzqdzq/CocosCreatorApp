Object.defineProperty(exports, "__esModule", { value: true });
const cc_1 = require("cc");
const new_gen_anim_1 = require("cc/editor/new-gen-anim");

const { readFile } = require("fs-extra");

const { getDependUUIDList } = require("../utils");

const AnimationMaskHandler = {
  name: "animation-mask",
  assetType: cc_1.js.getClassName(new_gen_anim_1.AnimationMask),
  createInfo: {
    generateMenuInfo() {
      return [
        {
          label: "i18n:ENGINE.assets.newAnimationMask",
          fullFileName: "Animation Mask.animask",
          template: `db://internal/default_file_content/${AnimationMaskHandler.name}/default.animask`,
          group: "animation",
        },
      ];
    },
  },
  importer: {
    version: "1.0.0",
    async import(e) {
      var a = await readFile(e.source, "utf8");

      var a = (await e.saveToLibrary(".json", a), getDependUUIDList(a));

      e.setData("depends", a);
      return true;
    },
  },
};

exports.default = AnimationMaskHandler;
