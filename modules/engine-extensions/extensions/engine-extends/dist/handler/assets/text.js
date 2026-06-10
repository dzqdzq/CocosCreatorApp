Object.defineProperty(exports, "__esModule", { value: true });
exports.TextHandler = undefined;

const { readFile } = require("fs-extra");

const { extname } = require("path");

const { getDependUUIDList } = require("../utils");

exports.TextHandler = {
  name: "text",
  assetType: "cc.TextAsset",
  async validate(e) {
    return (
      !(await e.isDirectory()) &&
      (e.extname !== ".ts" || extname(e.basename) === ".d")
    );
  },
  importer: {
    version: "1.0.1",
    async import(e) {
      var t = await readFile(e.source, "utf8");
      var a = new cc.TextAsset();
      var t = ((a.name = e.basename), (a.text = t), EditorExtends.serialize(a));
      await e.saveToLibrary(".json", t);
      var a = getDependUUIDList(t);

      e.setData("depends", a);
      return true;
    },
  },
};

exports.default = exports.TextHandler;
