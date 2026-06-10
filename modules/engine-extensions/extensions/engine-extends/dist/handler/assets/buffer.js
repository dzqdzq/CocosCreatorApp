Object.defineProperty(exports, "__esModule", { value: true });
exports.BufferHandler = undefined;

const { extname } = require("path");

const { getDependUUIDList } = require("../utils");

exports.BufferHandler = {
  name: "buffer",
  assetType: "cc.BufferAsset",
  importer: {
    version: "1.0.3",
    async import(e) {
      var r = extname(e.source);
      await e.copyToLibrary(r, e.source);
      try {
        var t = new cc.BufferAsset();

        t.name = e.basename || "";
        t._setRawAsset(".bin");
        var s = EditorExtends.serialize(t);
        await e.saveToLibrary(".json", s);
        var a = getDependUUIDList(s);

        e.setData("depends", a);
        return true;
      } catch (e) {
        console.error(e);
        return false;
      }
    },
  },
};

exports.default = exports.BufferHandler;
