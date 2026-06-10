Object.defineProperty(exports, "__esModule", { value: true });
exports.$ = undefined;
exports.template = undefined;
exports.style = undefined;
exports.ready = ready;
exports.exportConfig = exportConfig;
exports.importConfig = importConfig;
exports.close = close;
const fs_1 = require("fs");

const { readFileSync } = fs_1;

const { join } = require("path");

const program_1 = require("./program");
const Vue = require("vue/dist/vue.js");

Vue.config.productionTip = false;

const vueTemplate = ((Vue.config.devtools = false), fs_1.readFileSync)(
  join(__dirname, "../../../static/template/index.html"),
  "utf8"
);

const ProgramPreferenceVM = Vue.extend({
  name: "ProgramPreferenceVM",
  components: { program: program_1.ProgramComponent },
  data() {
    return { config: null };
  },
  async mounted() {
    var e = await Editor.Message.request("program", "query-program-config");
    this.config = e;
  },
  template: vueTemplate,
});

async function ready() {
  var e = this;
  e.vm?.$destroy();
  e.vm = new ProgramPreferenceVM();
  e.vm.$mount(e.$.container);
}
async function exportConfig() {
  var r = {};
  var e = await Editor.Message.request("program", "query-program-config");
  for (const o in e) {
    if (e[o].properties) {
      for (const i in e[o].properties) {
        let e = "global";
        var t = await Editor.Message.request(
          "preferences",
          "query-config",
          o,
          i,
          "local"
        );

        if (t != null) {
          e = "local";
        }

        r[o + "." + i] = {
          type: e,
          value:
            (await Editor.Message.request(
              "preferences",
              "query-config",
              o,
              i
            )) || {},
        };
      }
    }
  }
  return r;
}
async function importConfig(e) {
  var r = await Editor.Message.request("program", "query-program-config");
  for (const t in r) {
    if (r[t].properties) {
      for (const o in r[t].properties) {
        if (e[t + "." + o] && e[t + "." + o].value) {
          await Editor.Message.request(
            "preferences",
            "set-config",
            t,
            o,
            e[t + "." + o].value,
            e[t + "." + o].type
          );
        }
      }
    }
  }
}
function close() {
  this.vm?.$destroy();
  this.vm = null;
}

exports.style = readFileSync(
  join(__dirname, "../../../dist/index.css"),
  "utf8"
);

exports.template = '<div class="container"></div>';
exports.$ = { container: ".container" };
