Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.$ = undefined;
exports.template = undefined;
exports.style = undefined;
exports.ready = ready;
exports.beforeClose = beforeClose;
exports.close = close;

const { readFileSync } = require("fs");

const { join } = require("path");

const Vue = require("vue/dist/vue.js");
Vue.config.productionTip = false;
Vue.config.devtools = false;
let panel = null;
let vm = null;
function ready() {
  panel = this;
  vm?.$destroy();

  vm = new Vue({
    el: panel.$.container,
    components: {},
    directives: {},
    data: {
      isInit: false,
      isBaking: false,
      rate: 0,
      logs: [],
      isStart: false,
      isFinish: false,
      isEnd: false,
    },
    async mounted() {
      this.sceneReady = await Editor.Message.request("scene", "query-is-ready");

      if (this.sceneReady) {
        await this.refresh();
      }
    },
    updated() {
      this.scrollToBottom();
    },
    methods: {
      async refresh() {
        var e = await Editor.Message.request("scene", "execute-scene-script", {
          name: "light-probe",
          method: "query",
          args: [],
        });

        if (e) {
          this.isInit = true;
          this.$refs.props.render(e);

          this.$refs.props
            .querySelector("ui-section")
            .setAttribute("whole", "");
        }
      },
      confirm(e) {
        var e = e.target;

        if (e && (e = e.dump)) {
          Editor.Message.send("scene", "execute-scene-script", {
            name: "light-probe",
            method: "update",
            args: [e],
          });
        }
      },
      async baking() {
        if (!this.clickedBake) {
          this.clickedBake = true;

          setTimeout(() => {
            this.clickedBake = false;
          }, 1000 /* 1e3 */);

          try {
            var e;
            var t;

            if (this.isBaking) {
              Editor.Message.send("lightmap", "cancelLightProbe");
            } else {
              e = join(Editor.Project.path, "temp/light-probe");

              t = await Editor.Message.request("lightmap", "getConfig");

              t.path = e;
              Editor.Message.send("lightmap", "bakeLightProbe", t);

              Editor.Metrics._trackEventWithTimer({
                category: "bakingSystem",
                id: "A100009",
                value: 1,
              });
            }
          } catch (e) {
            console.error(e);
          }
        }
      },
      clear() {
        Editor.Message.send("scene", "execute-scene-script", {
          name: "light-probe",
          method: "clear",
          args: [],
        });
      },
      async updateLog() {
        var e = await Editor.Message.request("light-probe", "unstaging");
        this.rate = e.rate;
        this.logs = e.logs;
        this.isStart = e.isStart;
        this.isFinish = e.isFinish;
        this.isEnd = e.isEnd;
      },
      scrollToBottom() {
        this.$nextTick(() => {
          var e = this.$refs.logs;

          if (e && e.scrollHeight - e.scrollTop !== e.clientHeight) {
            e.scrollTop = e.scrollHeight;
          }
        });
      },
    },
  });
}
async function beforeClose() {
  return Editor.Message.request("scene", "execute-scene-script", {
    name: "light-probe",
    method: "beforeClose",
    args: [],
  });
}
function close() {
  vm?.$destroy();
  vm = null;
  panel = null;
}

exports.style = readFileSync(join(__dirname, "../dist/index.css"), "utf8");

exports.template = readFileSync(
  join(__dirname, "../static", "/index.html"),
  "utf8"
);

exports.$ = { container: ".container" };

exports.methods = {
  refresh() {
    if (vm) {
      vm.refresh();
    }
  },
  start() {
    if (vm) {
      vm.isBaking = true;
      vm.updateLog();
    }
  },
  cancel() {
    if (vm) {
      vm.isBaking = false;
      vm.updateLog();
    }
  },
  log() {
    if (vm) {
      vm.updateLog();
    }
  },
  progress() {
    if (vm) {
      vm.updateLog();
    }
  },
  finished() {
    if (vm) {
      vm.updateLog();
    }
  },
  end() {
    if (vm) {
      vm.isBaking = false;
      vm.updateLog();
    }
  },
  clear() {
    if (vm) {
      vm.updateLog();
    }
  },
};
