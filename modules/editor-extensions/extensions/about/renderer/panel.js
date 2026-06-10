const join = require("path").join;
const { existsSync, readFileSync, readJSONSync } = require("fs-extra");
const Vue = require("vue/dist/vue.js");

Vue.config.productionTip = false;
Vue.config.devtools = false;

const ABOUT_INFO_KEYS = [
  "engine",
  "editor",
  "external",
  "platformExtensions",
  "engineExtensions",
  "editorExtensions",
];

exports.style = readFileSync(
  join(__dirname, "../static/style/index.css"),
  "utf8"
);

exports.template = readFileSync(
  join(__dirname, "../static", "/template/index.html"),
  "utf8"
);

let commitInfo = {};
let time = null;
function formatTime(e = new Date()) {
  return new Date(e + 28800000 /* 288e5 */)
    .toJSON()
    .substr(0, 10)
    .replace(/-/g, ".");
}
exports.$ = { container: ".content" };

exports.ready = function () {
  var e = join(Editor.App.path, ".HEAD");
  if (existsSync(e)) {
    let n = readJSONSync(e);
    time = formatTime(n.time);

    n = ABOUT_INFO_KEYS.reduce((e, t) => {
      e[t] = n[t] ? n[t].substr(0, 7) : "unknown";
      return e;
    }, {});

    commitInfo = n;
  } else {
    commitInfo = ABOUT_INFO_KEYS.reduce((e, t) => {
      e[t] = "develop";
      return e;
    }, {});
  }
  this.vm?.$destroy();

  this.vm = new Vue({
    el: this.$.container,
    data: {
      version: Editor.App.version || "unknown",
      commit: commitInfo,
      time,
    },
    methods: {
      t(e) {
        return Editor.I18n.t("about." + e);
      },
    },
  });
};

exports.close = function () {
  this.vm?.$destroy();
  this.vm = null;
};
