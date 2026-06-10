Object.defineProperty(exports, "__esModule", { value: true });

exports.watch = undefined;
exports.computed = undefined;
exports.methods = undefined;
exports.components = undefined;
exports.props = undefined;
exports.template = undefined;

exports.created = created;
exports.data = data;

const { readFileSync, existsSync, readdirSync } = require("fs-extra");

const { join, extname, basename, dirname } = require("path");

function created() {}
function data() {
  return {};
}

exports.template = readFileSync(
  join(__dirname, "../../../static/template/main.html"),
  "utf8"
);

exports.props = ["platform"];
exports.components = {};

exports.methods = {
  t(t) {
    return Editor.I18n.t(t);
  },
};

exports.computed = {};
exports.watch = {};
const EXT_LIST = [".js", ".ccc", ".ccd", ".jsg", ".jsc"];
function existsFilePath(e) {
  var t = extname(e);
  var t = basename(e, t);
  e = join(dirname(e), t);

  return !!EXT_LIST.find((t) => existsSync(e + t));
}
!(() => {
  const a = join(__dirname, "../../plugins");
  readdirSync(a).forEach((t) => {
    join(a, t);
    var e;
    var r = join(a, t, "ui.js");

    if (existsFilePath(r)) {
      e = require(r);
      exports.components[e.name] = require(r);
    } else {
      console.warn(`load ${t} runtime dev plugin fail`);
    }
  });
})();
