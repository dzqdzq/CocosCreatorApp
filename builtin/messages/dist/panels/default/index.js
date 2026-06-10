Object.defineProperty(exports, "__esModule", { value: true });
exports.$ = undefined;
exports.template = undefined;
exports.style = undefined;
exports.ready = ready;
exports.close = close;

const { join } = require("path");

const { readFileSync } = require("fs-extra");

const electron_1 = require("electron");
const Vue = require("vue/dist/vue.js");
function ready() {
  var e = this;

  var s = Editor.Package.getPackages({ enable: true })
    .filter((e) => {
      if (e.info.contributions && e.info.contributions.messages) {
        for (const s in e.info.contributions.messages) {
          if (e.info.contributions.messages[s].public) {
            return true;
          }
        }
      }
      return false;
    })
    .map((e) => {
      for (const t in e.info.contributions.messages) {
        var s = e.info.contributions.messages[t];
        s.fold = false;

        if (s.example) {
          s.example = Editor.I18n.t(s.example.replace("i18n:", ""));
        }
      }
      return { name: e.name, messages: e.info.contributions.messages };
    });

  e.vm?.$destroy();

  var s = new Vue({
    el: e.$.container,
    data: {
      map: s,
      message: s[0],
      broadcast: false,
      public: false,
      isExpand: true,
      show: false,
    },
    methods: {
      onTabClick(e) {
        this.message = e;
        this.updateHiddenState();
        this.updateExpandState();
      },
      onChangeType(e) {
        this.broadcast = e == 1;
        this.updateHiddenState();
      },
      onCopyCode(e) {
        electron_1.clipboard.writeText(e.trim());
      },
      checkShowFlag(e, s) {
        return (
          !!s.public && (this.broadcast ? e.includes(":") : !e.includes(":"))
        );
      },
      updateHiddenState() {
        this.show = false;
        for (const s in this.message.messages) {
          var e = this.message.messages[s];
          if (this.checkShowFlag(s, e)) {
            this.show = true;
            break;
          }
        }
      },
      updateExpandState() {
        let e = true;
        for (const s in this.message.messages) {
          if (this.message.messages[s].fold) {
            e = false;
            break;
          }
        }
        this.isExpand = e;
      },
      onChangeExpandState() {
        this.isExpand = !this.isExpand;
        for (const e in this.message.messages) {
          this.message.messages[e].fold = !this.isExpand;
        }
      },
    },
  });

  s.updateHiddenState();
  e.vm = s;
}
function close() {
  this.vm?.$destroy();
  this.vm = null;
}
Vue.config.productionTip = false;
Vue.config.devtools = false;

exports.style = readFileSync(join(__dirname, "./index.css"), "utf8");

exports.template = readFileSync(
  join(__dirname, "../../../static", "./default/index.html"),
  "utf8"
);

exports.$ = { container: ".content" };
