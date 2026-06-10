Object.defineProperty(exports, "__esModule", { value: true });
exports.$ = undefined;
exports.template = undefined;
exports.style = undefined;
exports.exportConfig = exportConfig;
exports.importConfig = importConfig;
exports.ready = ready;
exports.close = close;

const { readFileSync } = require("fs");

const { join } = require("path");

const Vue = require("vue/dist/vue.js");
let panel = null;
let vm = null;

const vueTemplate = readFileSync(
  join(__dirname, "../../static/contributions/project-general.html"),
  "utf8"
);

const ProjectGeneralVM = Vue.extend({
  name: "ProjectGeneralVM",
  data() {
    return { defaultScene: "" };
  },
  async mounted() {
    var e = await Editor.Profile.getProject("scene", "current-scene");

    var e =
      ((this.defaultScene = e),
      await Editor.Package.getPackages({ name: "asset-db", enable: true }));

    if (!e || !e[0]) {
      await new Promise((e) => {
        setTimeout(e, 10000 /* 1e4 */);
      });
    }
  },
  methods: {
    defaultSceneChanged(e) {
      Editor.Profile.setProject("scene", "current-scene", e.target.value);
    },
  },
  template: vueTemplate,
});

async function exportConfig() {
  var e = {};

  e["general.renderPipeline"] =
    (await Editor.Message.request(
      "project",
      "query-config",
      "project",
      "general.renderPipeline"
    )) || "";

  return e;
}
async function importConfig(e) {
  if (e["general.renderPipeline"]) {
    await Editor.Message.request(
      "project",
      "set-config",
      "project",
      "general.renderPipeline",
      e["general.renderPipeline"]
    );
  }
}
function ready() {
  panel = this;
  vm?.$destroy();
  (vm = new ProjectGeneralVM()).$mount(panel.$.container);
}
function close() {
  vm?.$destroy();
  vm = null;
  panel = null;
}

exports.style = `
.general > ui-prop { padding: 2px 0; }
`;

exports.template = '<div class="container"></div>';
exports.$ = { container: ".container" };
