Object.defineProperty(exports, "__esModule", { value: true });
exports.$ = undefined;
exports.data = undefined;
exports.template = undefined;
exports.style = undefined;
exports.update = update;
exports.ready = ready;

const { readFileSync } = require("fs-extra");

const { join } = require("path");

const PKG_NAME = "taobao-mini-game";
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

`;

exports.template = readFileSync(join(__dirname, "../static/view.html"), "utf8");

const component = {
  data() {
    return {
      isNormalVersion,
      pkgOptions: {},
      includeModules: [],
    };
  },
  computed: {
    physics3D() {
      return !!this.includeModules.filter(
        (e) => e.startsWith("physics-") && !e.startsWith("physics-2d")
      ).length;
    },
  },
  methods: {
    t(e) {
      return Editor.I18n.t("taobao-mini-game." + e);
    },
    async init() {
      this.pkgOptions = panel.options.packages["taobao-mini-game"];
    },
    onChange(t) {
      var o = t.target.getAttribute("path");
      if (o) {
        let e = t.target.value;

        if (t.target.value === undefined || t.target.value === null) {
          e = t.target.getAttribute("value");
        }

        this.$set(this.pkgOptions, o, e);
        panel.dispatch("update", `packages.${PKG_NAME}.` + o, e, null);
      }
    },
    openProjectSettings() {
      Editor.Message.send("project", "open-settings", "engine", "modules");
    },
    async updateEngineModules() {
      this.includeModules =
        (
          await Editor.Message.request(
            "engine",
            "query-engine-modules-profile",
            panel.options.engineModulesConfigKey
          )
        )?.includeModules || [];
    },
  },
  mounted() {
    this.init();
  },
};

async function update(e, t) {
  panel = this;
  panel.options = e;

  if (t && t === "engineModulesConfigKey") {
    panel.vm.updateEngineModules();
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
exports.$ = { root: ".taobao-mini-game" };
