Object.defineProperty(exports, "__esModule", { value: true });
exports.UnknownHandler = undefined;
const asset_db_1 = require("@editor/asset-db");
const cc_1 = require("cc");
const remote_1 = require("@electron/remote");

const { getDependUUIDList } = require("../utils");

exports.UnknownHandler = {
  name: "*",
  assetType: "cc.Asset",
  iconInfo: {
    default: { type: "icon", value: "file" },
    generateThumbnail(e) {
      let t = "file";
      switch (e.extname) {
        case ".zip": {
          t = "zip";
          break;
        }
        case ".html": {
          t = "html5";
          break;
        }
        case ".bin": {
          t = "bin";
          break;
        }
        case ".svg": {
          t = "svg";
        }
      }
      return { type: "icon", value: t };
    },
  },
  async open(e) {
    return !!e.source && !(await remote_1.shell.openPath(e.source));
  },
  async validate(e) {
    return !e.isDirectory();
  },
  importer: {
    version: "1.0.0",
    async import(e) {
      var t;

      if (e instanceof asset_db_1.Asset) {
        await e.copyToLibrary(e.extname, e.source);
        t = new cc_1.Asset();
        t.name = e.basename;
        t._setRawAsset(e.extname);
        t = EditorExtends.serialize(t);
        await e.saveToLibrary(".json", t);
        t = getDependUUIDList(t);
        e.setData("depends", t);
      }

      return true;
    },
  },
};

exports.default = exports.UnknownHandler;
