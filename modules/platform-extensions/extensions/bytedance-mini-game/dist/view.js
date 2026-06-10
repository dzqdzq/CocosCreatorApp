Object.defineProperty(exports, "__esModule", { value: true });
exports.$ = undefined;
exports.data = undefined;
exports.style = undefined;
exports.template = undefined;
exports.update = update;
exports.ready = ready;

const { readFileSync } = require("fs-extra");

const { join } = require("path");

const PKG_NAME = "bytedance-mini-game";
let panel;

const isNormalVersion =
  /\d*\.\d*\.\d*$/.test(Editor.App.version) || Editor.App.dev;

exports.template = readFileSync(join(__dirname, "../static/view.html"), "utf8");

exports.style = `
.warning-tip {
  color: var(--color-warn-fill);
  font-size： 11px;
  line-height: 16px;
  margin-bottom: 2px;
}

.jump {
  cursor: pointer;
  text-decoration: underline;
}

.jump:hover {
  color: var(--color-focus-fill-weakest)
}
`;

const component = {
  data() {
    return {
      includeModules: [],
      isNormalVersion,
      pkgOptions: {},
      overwritePhysics: "",
      wasmConfig: { mode: "wasm", compressMode: "" },
    };
  },
  computed: {
    separateEngineWarningTip() {
      var e = this;
      return e.pkgOptions.separateEngine
        ? e.wasmConfig.mode !== "wasm" || e.wasmConfig.compressMode
          ? "i18n:bytedance-mini-game.tips.separate_engine_with_wasm"
          : undefined
        : "";
    },
    physicsX() {
      var e = this;
      return (
        e.physics3D &&
        (e.overwritePhysics === "physics-physx" ||
          (e.overwritePhysics === "inherit-project-setting" &&
            e.includeModules.includes("physics-physx")))
      );
    },
    physics3D() {
      return !!this.includeModules.filter(
        (e) => e.startsWith("physics-") && !e.startsWith("physics-2d")
      ).length;
    },
    selectStyle() {
      return this.physics3D
        ? { display: "flex" }
        : { display: "flex", color: "var(--color-warn-fill)" };
    },
  },
  methods: {
    t(e) {
      return Editor.I18n.t("bytedance-mini-game.options." + e);
    },
    async updateEngineModules() {
      console.debug("engine-modules-config-changed");

      this.includeModules =
        (
          await Editor.Message.request(
            "engine",
            "query-engine-modules-profile",
            panel.options.engineModulesConfigKey
          )
        )?.includeModules || [];
    },
    updatePhysicsOption() {
      this.overwritePhysics =
        panel.options.overwriteProjectSettings?.includeModules?.physics;
    },
    async init() {
      this.pkgOptions = panel.options.packages["bytedance-mini-game"];
      this.wasmConfig.mode = panel.options.nativeCodeBundleMode;
      this.wasmConfig.compressMode = panel.options.wasmCompressionMode;
      await this.updateEngineModules();
      this.updatePhysicsOption();
    },
    onChange(e) {
      var t = e.target.value;
      var e = e.target.getAttribute("path");
      this.$set(this.pkgOptions, e, t);
      panel.dispatch("update", `packages.${PKG_NAME}.` + e, t, null);
    },
    openProjectSettings() {
      Editor.Message.send("project", "open-settings", "engine", "modules");
    },
  },
  async mounted() {
    await this.init();

    Editor.Message.__protected__.addBroadcastListener(
      "engine:engine-modules-config-changed",
      this.updateEngineModules
    );
  },
  beforeDestroy() {
    Editor.Message.__protected__.removeBroadcastListener(
      "engine:engine-modules-config-changed",
      this.updateEngineModules
    );
  },
};

async function update(e, t, s) {
  panel = this;
  panel.options = e;

  if (t && t === "engineModulesConfigKey") {
    panel.vm.updateEngineModules();
  } else if (t && t === "overwriteProjectSettings.includeModules.physics") {
    panel.vm.updatePhysicsOption(e);
  } else if (!t || t.startsWith("packages." + panel.pkgName)) {
    panel.vm.init();
  }
}
function ready(e) {
  panel = this;
  var t = require("vue/dist/vue.js");
  panel.options = e;
  panel.pkgName = PKG_NAME;
  panel.vm = new t({ el: panel.$.root, ...component });
}
exports.data = { vm: null, options: {} };
exports.$ = { root: ".bytedance-mini-game" };
