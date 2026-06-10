var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.$ = undefined;
exports.style = undefined;
exports.template = undefined;
exports.ready = ready;
exports.close = close;

const { readFileSync } = require("fs");

const { readJSONSync } = require("fs-extra");

const { join } = require("path");

const vue_js_1 = __importDefault(require("vue/dist/vue.js"));

const defaultPresets = readJSONSync(
  join(__dirname, "../../../static/curve-editor/preset.json")
);

let panel;
let vm;
const vueTemplate = readFileSync(
  join(__dirname, "../../../static/curve-editor/index.html"),
  "utf8"
);
function ready() {
  panel = this;
}
function close() {
  vm?.$destroy();
  vm = null;
  delete panel.$.editor;
}
function initVue(t) {
  let e = null;
  vm?.$destroy();

  vm = new vue_js_1.default({
    el: panel.$.container,
    directives: {
      set: {
        inserted(e, t, n) {
          var { arg: t, value } = t;

          if (t) {
            Reflect.set(e, t, value);
          }
        },
        update(e, t, n, a) {
          var { arg: t, value } = t;

          if (t) {
            Reflect.set(e, t, value);
          }
        },
      },
    },
    data() {
      return {
        maxValue: { x: 5, y: 5 },
        showSettings: false,
        presets: { default: {}, custom: {} },
        presetConfig: { negative: true, tab: "default" },
        newPreset: { name: "" },
        value: t.value,
        config: {
          showPreWrapMode: (t.config && t.config.showPreWrapMode) || 0,
          showPostWrapMode: (t.config && t.config.showPostWrapMode) || 0,
        },
        label: t.label,
      };
    },
    methods: {
      onRemovePreset(e) {
        vm.$set(vm.presets.custom, e, null);
        delete vm.presets.custom[e];

        Editor.Profile.setConfig(
          "ui-kit",
          "curve-editor.customPresets",
          vm.presets.custom,
          "global"
        );
      },
      showPopup() {
        clearTimeout(e);

        e = setTimeout(() => {
          vm.showSettings = true;
        }, 200);
      },
      hidePopup() {
        clearTimeout(e);

        e = setTimeout(() => {
          vm.showSettings = false;
        }, 200);
      },
      async init() {
        var e = await Editor.Profile.getConfig(
          "ui-kit",
          "curve-editor.customPresets"
        );

        if (vm) {
          vm.presets.custom = e || {};

          vm.presets.default = defaultPresets.default.map((e) => ({
            keys: e,
          }));

          panel.$.editor.clear();

          panel.$.editor.config = Object.assign(
            panel.$.editor.config,
            t.config
          );

          panel.$.editor.initCurveCtrl();
          panel.$.editor.value = transValueToCurves(vm.value, vm.label);
        }
      },
      onCurveSettings(e) {
        e.stopPropagation();
        e.preventDefault();
        var t = parseInt(e.target.value);
        var n = e.target.getAttribute("name");
        switch (n) {
          case "postWrapMode":
          case "preWrapMode": {
            panel.$.editor.curveCtrl.updateCurveWrapMode(n, t);
            vm.value[n] = t;
            panel.$.editor.value = transValueToCurves(vm.value, vm.label);
            vm.emit("change");
            vm.emit("confirm");
            break;
          }
          case "spacingFrame": {
            panel.$.editor.curveCtrl.config.spacingFrame = t;
          }
        }
      },
      async onPreset(e) {
        e.stopPropagation();
        e.preventDefault();
        e = e.target.getAttribute("index");
        if (e) {
          e = vm.presets[vm.presetConfig.tab][e];
          if (e && e.keys.length) {
            var t = patchMultiToKeys(JSON.parse(JSON.stringify(e.keys))).find(
              (e) =>
                e.point.y !==
                Editor.Utils.Math.clamp(
                  e.point.y,
                  panel.option.config.yRange[0],
                  panel.option.config.yRange[1]
                )
            );
            if (t) {
              Editor.Panel.__protected__.holdKit();

              if (
                (
                  await Editor.Dialog.warn(
                    Editor.I18n.t("ui-kit.curve_editor.presetOutRange"),
                    {
                      cancel: 0,
                      buttons: ["cancel", "confirm"],
                      default: 0,
                    }
                  )
                ).response === 0
              ) {
                return;
              }
            }
            vm.value.keys = patchMultiToKeys(e.keys);
            panel.$.editor.value = transValueToCurves(vm.value, vm.label);
            vm.emit("change");
            vm.emit("confirm");
          }
        }
      },
      onResetScale() {
        panel.$.editor.curveCtrl.resetScale();
      },
      onNewPreset() {
        vm.$set(vm.presets.custom, vm.newPreset.name, {
          ...vm.value,
          keys: unpatchMultiToKeys(vm.value.keys),
        });

        Editor.Profile.setConfig(
          "ui-kit",
          "curve-editor.customPresets",
          vm.presets.custom,
          "global"
        ).then(() => {
          this.newPreset.name = "";
        });
      },
      emit(e, t) {
        console.debug("emit", e, t);

        if (t) {
          vm.value.keys = transCurvesToKeys(t, vm.label);
        }

        t = unpatchMultiToKeys(vm.value.keys);

        if (checkValueOutRange(t, [0, 1], vm.config.yRange)) {
          console.debug("[Curve Editor] keys out of range");
        } else {
          e = new CustomEvent(e, {
            detail: { value: { ...vm.value, keys: t } },
          });

          panel.$.editor.getRootNode().dispatchEvent(e);
        }
      },
      onMulti(e) {
        e.stopPropagation();
        e.preventDefault();
        e = e.target.value;
        if (!(vm.value.multiplier === e || e < 0) && e) {
          const t = e / vm.value.multiplier;
          vm.value.keys = patchMultiToKeys(vm.value.keys, t);

          panel.$.editor.config.yRange = panel.$.editor.config.yRange.map(
            (e) => e * t
          );

          vm.value.multiplier = e;
          panel.$.editor.initCurveCtrl();
          panel.$.editor.value = transValueToCurves(vm.value, vm.label);
          vm.emit("change");
        }
      },
      onMultiConfirm(e) {
        e.stopPropagation();
        e.preventDefault();
        var t = e.target.value;
        const e_target = e.target;

        if (!t || t <= 0) {
          requestAnimationFrame(() => {
            e_target.value = panel?.option?.value?.multiplier || 1;
          });
        } else {
          vm.emit("confirm");
        }
      },
    },
    template: vueTemplate,
  });

  panel.$.editor = vm.$refs.editor;
  vm.init();
}
function checkValueOutRange(e, n, a) {
  return (
    !(!n && !a) &&
    e.find((e) => {
      var { x: e, y } = e.point;
      return (
        !!(
          (n && typeof n[0] == "number" && e < n[0]) ||
          (n && typeof n[1] == "number" && e > n[1])
        ) ||
        !!(
          (a && typeof a[0] == "number" && y < a[0]) ||
          (a && typeof a[1] == "number" && y > a[1])
        )
      );
    })
  );
}
function patchMultiToKeys(e, t) {
  t = t || panel.option.value.multiplier || 1;

  return e.map((e) => ({
    tangentWeightMode: e.tangentWeightMode,
    interpMode: e.interpMode,
    inTangentWeight: e.inTangentWeight * t,
    outTangentWeight: e.outTangentWeight * t,
    point: { x: e.point.x, y: e.point.y * t },
    inTangent: e.inTangent * t,
    outTangent: e.inTangent * t,
  }));
}
function unpatchMultiToKeys(e, t) {
  t = t || panel.option.value.multiplier || 1;

  return e.map((e) => ({
    tangentWeightMode: e.tangentWeightMode,
    interpMode: e.interpMode,
    inTangentWeight: e.inTangentWeight / t,
    outTangentWeight: e.outTangentWeight / t,
    point: { x: e.point.x, y: e.point.y / t },
    inTangent: e.inTangent / t,
    outTangent: e.inTangent / t,
  }));
}
function transValueToCurves(e, t) {
  return {
    duration: 1,
    wrapMode: 1,
    curveInfos: {
      [t]: {
        preWrapMode: e.preWrapMode,
        postWrapMode: e.postWrapMode,
        keys: e.keys,
        color: "red",
      },
    },
  };
}
function transCurvesToKeys(e, t) {
  return e.curveInfos[t].keys;
}

exports.template = `
    <div class="curve-editor"></div>
`;

exports.style = readFileSync(join(__dirname, "../../curve-editor.css"), "utf8");

exports.$ = { container: ".curve-editor" };

exports.methods = {
  async reset(t) {
    if (t) {
      (panel.option = t).config
        ? Object.assign(t.config, { axisMargin: 20 })
        : (console.warn(`Get config of curve (${t.label}) failed!`),
          (t.config = {}));

      t.value.multiplier
        ? ((t.value.keys = patchMultiToKeys(t.value.keys, t.value.multiplier)),
          t.config.yRange
            ? (t.config.yRange = t.config.yRange.map(
                (e) => e * t.value.multiplier
              ))
            : (t.config.yRange = [0, 1]))
        : ((t.value.multiplier = 1),
          (t.config.yRange = t.config.yRange || [0, 1]));

      vm
        ? ((vm.value = t.value),
          (vm.label = t.label),
          (vm.config.showPreWrapMode = !!t.config.showPreWrapMode),
          (vm.config.showPostWrapMode = !!t.config.showPostWrapMode),
          (t.config.spacingFrame =
            (await Editor.Profile.getConfig(
              "ui-kit",
              "curve-editor.spacingFrame"
            )) || 0.1),
          (vm.config.negative = !(t.config.yRange && t.config.yRange[0] >= 0)),
          panel.$.editor.curveCtrl.clear(),
          (panel.$.editor.config = Object.assign(
            panel.$.editor.config,
            t.config
          )),
          panel.$.editor.initCurveCtrl(),
          (panel.$.editor.value = transValueToCurves(t.value, t.label)))
        : initVue.call(this, t);
    }
  },
  clear() {},
  deleteSelectedKeys() {
    if (panel.$.editor.curveCtrl) {
      panel.$.editor.curveCtrl.delSelectedKeys();
    }
  },
  copySelectedKeys() {
    if (panel.$.editor.curveCtrl) {
      panel.$.editor.curveCtrl.copySelectedKeys();
    }
  },
};
