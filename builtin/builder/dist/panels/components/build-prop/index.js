var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });

exports.methods = undefined;
exports.name = undefined;
exports.watch = undefined;
exports.computed = undefined;
exports.props = undefined;
exports.template = undefined;

exports.mounted = mounted;
const lodash_1 = __importDefault(require("lodash"));
function mounted() {
  const t = this;

  if (t.$refs.this) {
    t.updateRender(t.dump);
  }

  if (t.$refs.this && t.$refs.this.$label) {
    t.$refs.this.$label.addEventListener("mouseup", (e) => {
      if (e.button === 2) {
        e = [
          {
            label: Editor.I18n.t("builder.copyPropertyKey") + ": " + t.path,
            click() {
              Editor.Clipboard.write("text", t.path);
            },
          },
        ];

        t.dump.default === undefined ||
          t.dump.default === null ||
          lodash_1.default.isEqual(t.value, t.dump.default) ||
          e.push({
            label: Editor.I18n.t("builder.resetToDefaultValue"),
            click() {
              t.$emit("update", t.path, t.dump.default);
            },
          });

        Editor.Menu.popup({ menu: e });
      }
    });
  }
}

exports.template = `
<ui-prop type="build"
    ref="this"
    v-if="config"
    class="build-prop"
    @change.stop="onChange"
    @confirm.stop="onConfirm"
></ui-prop>
`;

exports.props = ["config", "path", "value", "pkgName", "configKey"];

exports.computed = {
  show() {
    var e = this;
    return (
      (e.config && e.config.ui) ||
      (e.config.type !== "object" && e.config.type !== "array")
    );
  },
  disabled() {
    var e = this;
    if (!Array.isArray(e.config.disabledWhen)) {
      return false;
    }
    for (const t of e.config.disabledWhen) {
      if (!e.pkgOptions[t]) {
        return false;
      }
    }
    return true;
  },
  dump() {
    var e = this;
    return typeof e.configKey == "object"
      ? null
      : { ...e.config, value: e.value };
  },
};

exports.watch = {
  dump(e, t) {
    var o = this;

    if (
      JSON.stringify(o.$refs.this.dump) !== JSON.stringify(e) &&
      o.$refs.this
    ) {
      o.updateRender(o.dump);
    }
  },
};

exports.name = "build-prop";

exports.methods = {
  onChange(e) {
    const o = e.target.dump;
    let r = (o.verifyLevel === "error" && o.message) || "";

    if (o.itemConfigs) {
      r = {};

      Object.keys(o.itemConfigs).forEach((e) => {
        var t = o.itemConfigs[e];

        if (t.message && t.verifyLevel === "error") {
          r[e] = t.message;
        }
      });
    }

    this.$emit("update", this.path, o.value, r);
  },
  onConfirm(e) {
    e = e.target.dump;
    this.$emit("data-confirm", this.path, e.value);
  },
  updateRender(e) {
    var t = this;

    if (t.$root.options) {
      t.$refs.this.customInfo = {
        options: JSON.parse(JSON.stringify(t.$root.options)),
        pkgKey:
          e.verifyKey || t.$root.options.platform + (t.pkgName || "common"),
      };
    }

    t.$refs.this.dump = e;
    t.$refs.this.render();
  },
};
