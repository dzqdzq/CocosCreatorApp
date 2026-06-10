Object.defineProperty(exports, "__esModule", { value: true });

exports.computed = undefined;
exports.watch = undefined;
exports.methods = undefined;
exports.props = undefined;
exports.template = undefined;

exports.created = created;
exports.data = data;

const { readFileSync } = require("fs-extra");

const { join } = require("path");

const info_1 = require("../../utils/info");
const base_1 = require("../../utils/base");
function created() {
  this.register_handler();
}
function data() {
  return { infoType: base_1.LOG_LEVEL.LOG, content: "" };
}

exports.template = readFileSync(
  join(__dirname, "../../../static/template/info.html"),
  "utf8"
);

exports.props = [];

exports.methods = {
  t(e) {
    return Editor.I18n.t(e);
  },
  register_handler() {
    info_1.info.on("log", (e, ...t) => {
      this.infoType = e;
      this.content = t.join(" ");
    });
  },
};

exports.watch = {};
exports.computed = {};
