Object.defineProperty(exports, "__esModule", { value: true });
exports.JsZip = undefined;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
exports.JsZip = require("jszip");

exports.JsZip.prototype.directory = function (e, r) {
  if (fs_extra_1.statSync(e).isDirectory()) {
    fs_extra_1.readdirSync(e).forEach(
      function (e) {
        var r = this.zip;
        var t = path_1.join(this.srcPath, e);
        var i = fs_extra_1.statSync(t);

        if (i.isDirectory()) {
          r.directory(t, e);
        } else if (i.isFile()) {
          r.file(e, fs_extra_1.readFileSync(t));
        } else {
          console.error(`{link(${t})} was not added to zip!`);
        }
      }.bind({ srcPath: e, zip: this.folder(r) })
    );
  } else {
    console.error(`{link(${e})} is not a folder!`);
  }
};

exports.JsZip.prototype.append = function (e, r) {
  if (fs_extra_1.statSync(e).isFile()) {
    this.file(r, fs_extra_1.readFileSync(e));
  } else {
    console.error(e + " is not a file!");
  }
};
