Object.defineProperty(exports, "__esModule", { value: true });
exports.$ = undefined;
exports.data = undefined;
exports.template = undefined;
exports.style = undefined;
exports.update = update;
exports.ready = ready;

const { readFileSync } = require("fs-extra");

const { join } = require("path");

const PKG_NAME = "wechatgame";
let panel;

const isNormalVersion =
  /\d*\.\d*\.\d*$/.test(Editor.App.version) || Editor.App.dev;

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

.high-performance-mode-message > ui-label {
  display: inline;
}

.separate-engine-invalid > ui-label[slot='label'],
.separate-engine-invalid > div[slot='content'] {
  opacity: 0.55;
  pointer-events: none;
}
.separate-engine-invalid > div[slot='message'],
.separate-engine-warning > div[slot='message'] {
  color: var(--color-warn-fill-weaker);
}
`;

exports.template = readFileSync(join(__dirname, "../static/view.html"), "utf8");

const component = {
  data() {
    return {
      isNormalVersion,
      pkgOptions: {},
      wasmConfig: { mode: "wasm", compressMode: "" },
    };
  },
  computed: {
    separateEngineWarningTip() {
      var e = this;
      return e.pkgOptions.separateEngine
        ? e.wasmConfig.mode !== "wasm" || e.wasmConfig.compressMode
          ? "i18n:wechatgame.tips.separate_engine_with_wasm"
          : undefined
        : "";
    },
  },
  methods: {
    t(e) {
      return Editor.I18n.t("wechatgame." + e);
    },
    async init() {
      this.wasmConfig.mode = panel.options.nativeCodeBundleMode;
      this.wasmConfig.compressMode = panel.options.wasmCompressionMode;
      this.pkgOptions = panel.options.packages.wechatgame;
    },
    onChange(t) {
      var a = t.target.getAttribute("path");
      if (a) {
        let e = t.target.value;

        if (t.target.value === undefined || t.target.value === null) {
          e = t.target.getAttribute("value");
        }

        this.$set(this.pkgOptions, a, e);
        panel.dispatch("update", `packages.${PKG_NAME}.` + a, e, null);
      }
    },
    openProjectSettings() {
      Editor.Message.send("project", "open-settings", "engine", "modules");
    },
  },
  mounted() {
    this.init();
  },
};

async function update(e, t) {
  panel = this;

  switch (t) {
    case "nativeCodeBundleMode": {
      panel.vm.wasmConfig.mode = e.nativeCodeBundleMode;
      break;
    }
    case "wasmCompressionMode": {
      panel.vm.wasmConfig.compressMode = e.wasmCompressionMode;
    }
  }

  if (!t || t.startsWith("packages." + panel.pkgName)) {
    panel.options = e;
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
exports.$ = { root: ".wechatgame" };
