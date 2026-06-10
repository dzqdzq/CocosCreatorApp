Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.template = undefined;
exports.data = data;

const { readFileSync } = require("fs");

const { join } = require("path");

function data() {
  return {};
}

exports.template = readFileSync(
  join(__dirname, "../../../../static/template/components/dialog.html"),
  "utf8"
);

exports.methods = {
  async show(e) {
    var t = { title: e, detail: "detail" };
    switch (e) {
      case "info": {
        t.type = "info";
        break;
      }
      case "warn": {
        t.type = "warn";
        break;
      }
      case "error": {
        t.type = "error";
        break;
      }
      case "buttons": {
        e = "info";
        t.buttons = ["a", "b", "c", "d"];
      }
    }
    var a = await Editor.Dialog[e](e + " + message", t);
    console.log(JSON.stringify(a, null, 2));
  },
  async openFile(e) {
    var t = {};
    switch (e) {
      case "root": {
        t.path = __dirname;
        break;
      }
      case "filters": {
        t.filters = [{ name: "Images", extensions: ["jpg", "png", "gif"] }];
      }
    }
    e = await Editor.Dialog.select(t);
    console.log(JSON.stringify(e, null, 2));
  },
  async openDirectory() {
    var e = await Editor.Dialog.select({ type: "directory" });
    console.log(JSON.stringify(e, null, 2));
  },
  async save(e) {
    var t = {};
    var e = (e === "root" && (t.path = __dirname), await Editor.Dialog.save(t));
    console.log(JSON.stringify(e, null, 2));
  },
};
