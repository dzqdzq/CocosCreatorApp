Object.defineProperty(exports, "__esModule", { value: true });
exports.AnimationMaskImporter = undefined;
const asset_db_1 = require("@editor/asset-db");
const cc_1 = require("cc");
const new_gen_anim_1 = require("cc/editor/new-gen-anim");
const fs_extra_1 = require("fs-extra");
const utils_1 = require("../utils");
class AnimationMaskImporter extends asset_db_1.Importer {
  get version() {
    return "" + super.version;
  }
  get name() {
    return "animation-mask";
  }
  get assetType() {
    return cc_1.js.getClassName(new_gen_anim_1.AnimationMask);
  }
  async import(e) {
    var r = await fs_extra_1.readFile(e.source, "utf8");
    var r = (await e.saveToLibrary(".json", r), utils_1.getDependUUIDList(r));
    e.setData("depends", r);
    return true;
  }
}
exports.AnimationMaskImporter = AnimationMaskImporter;
