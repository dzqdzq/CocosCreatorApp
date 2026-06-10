Object.defineProperty(exports, "__esModule", { value: true });

exports.watch = undefined;
exports.methods = undefined;
exports.computed = undefined;
exports.props = undefined;
exports.template = undefined;

exports.created = created;
exports.data = data;

const { readFileSync } = require("fs-extra");

const { join } = require("path");

const log_1 = require("../../utils/log");
function created() {}
function data() {
  return { logs: log_1.log.logs };
}

exports.template = readFileSync(
  join(__dirname, "../../../static/template/console.html"),
  "utf8"
);

exports.props = [];
exports.computed = {};

exports.methods = {
  t(t) {
    return Editor.I18n.t(t);
  },
};

exports.watch = {
  logs(t) {
    this.$el.scrollTop = this.$el.scrollHeight;
  },
};
