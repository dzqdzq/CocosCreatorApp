Object.defineProperty(exports, "__esModule", { value: true });
exports.JsZip = undefined;

const { statSync, readdirSync, readFileSync } = require("fs-extra");

const { join } = require("path");

exports.JsZip = require("jszip");

exports.JsZip.prototype.directory = function (e, r) {
  if (statSync(e).isDirectory()) {
    readdirSync(e).forEach(
      function (e) {
        var r = this.zip;
        var t = join(this.srcPath, e);
        var i = statSync(t);

        if (i.isDirectory()) {
          r.directory(t, e);
        } else if (i.isFile()) {
          r.file(e, readFileSync(t));
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
  if (statSync(e).isFile()) {
    this.file(r, readFileSync(e));
  } else {
    console.error(e + " is not a file!");
  }
};
