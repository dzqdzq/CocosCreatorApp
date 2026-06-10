Object.defineProperty(exports, "__esModule", { value: true });
exports.$ = undefined;
exports.template = undefined;
exports.style = undefined;
exports.ready = ready;
exports.close = close;

const { readFileSync } = require("fs-extra");

const { join } = require("path");

const Vue = require("vue/dist/vue.js");
Vue.config.productionTip = false;
Vue.config.devtools = false;
let panel = null;
let vm = null;

const vueTemplate = readFileSync(
  join(__dirname, "../../static/template/debugger.html"),
  "utf8"
);

const PreviewDebuggerVM = Vue.extend({
  name: "PreviewDebuggerVM",
  data() {
    return {
      resolutionIndex: -1,
      devices: [],
      orientation: "",
      optionalOrientation: ["landscape", "portrait"],
    };
  },
  async mounted() {
    var e = await Editor.Message.request("device", "query");

    var t = await Editor.Profile.getConfig(
      "preview",
      "preview.simulator_resolution"
    );

    var i = await Editor.Profile.getConfig(
      "preview",
      "preview.simulator_orientation"
    );

    this.devices = e.map((e) => `${e.name} (${e.width} x ${e.height})`);

    this.resolutionIndex = t;
    this.orientation = i;
  },
  methods: {
    async onSelectResolutionSize(e) {
      if (typeof e == "string") {
        e = Number.parseInt(e);
      }

      await Editor.Profile.setConfig(
        "preview",
        "preview.simulator_resolution",
        e
      );

      Editor.Message.send("preview", "restart-simulator");
    },
    async onSelectOrientation(e) {
      await Editor.Profile.setConfig(
        "preview",
        "preview.simulator_orientation",
        e
      );

      Editor.Message.send("preview", "restart-simulator");
    },
  },
  template: vueTemplate,
});

async function ready() {
  panel = this;
  vm?.$destroy();
  (vm = new PreviewDebuggerVM()).$mount(panel.$.container);
}
function close() {
  vm?.$destroy();
  vm = null;
  panel = null;
}

exports.style = readFileSync(
  join(__dirname, "../../static/style/debugger.css"),
  "utf8"
);

exports.template = '<div class="container"></div>';
exports.$ = { container: ".container" };
