Object.defineProperty(exports, "__esModule", { value: true });
exports.TTFFontHandler = undefined;

const { getDependUUIDList } = require("../utils");

function createTTFFont(e) {
  var t = new cc.TTFFont();
  t.name = e.basename;
  t._setRawAsset(t.name + ".ttf");
  return t;
}

exports.TTFFontHandler = {
  name: "ttf-font",
  assetType: "cc.TTFFont",
  importer: {
    version: "1.0.1",
    async import(e) {
      var t = e.basename + ".ttf";
      var t = (await e.copyToLibrary(t, e.source), createTTFFont(e));
      var t = EditorExtends.serialize(t);

      var t = (await e.saveToLibrary(".json", t), getDependUUIDList(t));

      e.setData("depends", t);
      return true;
    },
  },
};

exports.default = exports.TTFFontHandler;
