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
  join(__dirname, "../../../static/contributions/project-graphics.html"),
  "utf8"
);

const EngineGraphicsVM = Vue.extend({
  name: "EngineGraphicsVM",
  data() {
    return {
      pipeline: "custom-pipeline",
      enableCustomPipelinePostProcess: false,
      renderPipeline: "",
      renderPipelines: [],
      pipelineName: "",
      switchPipelineTipTaskId: 0,
      postProcessRenderConfig: {
        default: false,
        label: "i18n:ENGINE.features.custom_pipeline_post_process.label",
        description:
          "i18n:ENGINE.features.custom_pipeline_post_process.description",
      },
      includeModules: [],
    };
  },
  async mounted() {
    this.switchPipelineTipTaskId = await Editor.Profile.getTemp(
      "engine",
      "switchPipelineTipTaskId"
    );

    this.pipelineName = await Editor.Profile.getProject(
      "engine",
      "macroConfig.CUSTOM_PIPELINE_NAME"
    );

    const e = await Editor.Profile.getProject(
      "project",
      "general.renderPipeline"
    );
    this.renderPipeline = e;
    var i = await Editor.Profile.getConfig("engine", "deferred_pipeline");
    let t = await Editor.Message.request(
      "asset-db",
      "query-assets",
      { pattern: "db://**/*.rpp" },
      ["meta"]
    );

    if (!Array.isArray(t)) {
      t = [];
    }

    if (
      !i &&
      ((t = t.filter((e) => e.uuid !== "5d45ba66-829a-46d3-948e-2ed3fa7ee421")),
      this.renderPipeline === "5d45ba66-829a-46d3-948e-2ed3fa7ee421")
    ) {
      await Editor.Profile.removeProject(
        "project",
        "general.renderPipeline",
        "project"
      );
      const e = await Editor.Profile.getProject(
        "project",
        "general.renderPipeline"
      );
      this.renderPipeline = e;
    }

    this.renderPipelines = t.map((e) => ({
      uuid: e.uuid,
      name: e.name,

      contributed:
        e.meta && e.meta.userData && e.meta.userData.contributed
          ? e.meta.userData.contributed
          : "",
    }));

    this.update();
  },
  methods: {
    renderPipelineChanged(e) {
      this.renderPipeline = e.target.value;

      Editor.Profile.setProject(
        "project",
        "general.renderPipeline",
        this.renderPipeline
      );
    },
    pipelineNameChange(e) {
      this.pipelineName = e.target.value;

      Editor.Profile.setProject(
        "engine",
        "macroConfig.CUSTOM_PIPELINE_NAME",
        this.pipelineName
      );
    },
    async postProcessRenderConfigChanged(e) {
      e = e.target.value;

      await Editor.Profile.setProject(
        "engine",
        "modules.graphics.custom-pipeline-post-process",
        e,
        "project"
      );

      this.enableCustomPipelinePostProcess = e;
      this.update();
      this.broadcast();
    },
    async customPipelineChanged(e) {
      var e = e.target.value;

      var i = await Editor.Profile.getConfig(
        "engine",
        "customPipeline",
        "default"
      );

      if (i == null) {
        Editor.Profile.setConfig(
          "engine",
          "customPipeline",
          this.pipeline,
          "default"
        );
      }

      this.pipeline = e;

      await Editor.Profile.setProject(
        "engine",
        "modules.graphics.pipeline",
        this.pipeline,
        "project"
      );

      this.update();
      this.broadcast();

      if (i !== this.pipeline) {
        Editor.Dialog.info(
          Editor.I18n.t("engine.project.graphics.switchPipelineTips"),
          {
            title: Editor.I18n.t("engine.project.graphics.title"),
            buttons: [Editor.I18n.t("engine.confirm")],
          }
        );
      }
    },
    async broadcast() {
      var e =
        (await Editor.Message.request("engine", "query-engine-modules-profile"))
          ?.includeModules ?? [];
      Editor.Message.broadcast(
        "engine:engine-modules-global-config-changed",
        e
      );
    },
    async update() {
      var e =
        (await Editor.Profile.getProject("engine", "modules.graphics")) ?? {};
      this.pipeline = e.pipeline || "custom-pipeline";
      this.enableCustomPipelinePostProcess =
        !!e["custom-pipeline-post-process"];
    },
  },
  template: vueTemplate,
});

async function ready() {
  panel = this;
  vm?.$destroy();
  (vm = new EngineGraphicsVM()).$mount(panel.$.container);
}
function close() {
  vm?.$destroy();
  vm = null;
  panel = null;
}

exports.style = `
ui-radio-group {
    width: 100%;
}
.ml {
    margin-left: 40px;
}
div[disabled], ui-prop[disabled] {
    opacity: 0.5;
}
`;

exports.template = '<div class="container"></div>';
exports.$ = { container: ".container" };
