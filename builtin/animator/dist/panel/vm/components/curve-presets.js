Object.defineProperty(exports, "__esModule", { value: true });
exports.CurvePresets = undefined;

const { defineComponent, ref, watchEffect } = require("vue/dist/vue.js");

const template = `
  <section class="curve-settings" @mousewheel.stop active="">
      <div class="toolbar tw-flex tw-items-center tw-mb-1">
          <div class="tab-item" active>
              <ui-label value="i18n:animator.curvePreset"></ui-label>
              <ui-icon value="info" tooltip="i18n:animator.curvePresetTips"></ui-icon>
          </div>
          <div class="tw-flex-1"></div>
          <ui-button icon transparent @click="onHideClick">
              <ui-icon value="collapse-right" ></ui-icon>
          </ui-button>
      </div>
      <header class="header tw-mb-1">
          <ui-input
              show-clear
              placeholder="i18n:animator.curvePresetSearchPlaceholder"
              tooltip="i18n:animator.curvePresetSearchTips"
              @change="onSearchChange"
          ></ui-input>
      </header>
      <div class="curve-presets">
          <div class="preset-item" v-for="presetItem in presets" :key="presetItem.name">
              <svg @click="onItemClick(presetItem)" :disabled="disabled">
                  <path transform="scale(44)" :d="presetItem.svgData"></path>
              </svg>
              <ui-label class="name" :tooltip="presetItem.name">{{presetItem.name}}</ui-label>
          </div>
      </div>
  </section>
`;

exports.CurvePresets = defineComponent({
  name: "CurvePresets",
  components: {},
  props: {
    presets: { type: Array, default: () => [] },
    disabled: { type: Boolean, default: false },
    visible: { type: Boolean, default: false },
    search: { type: String, default: undefined },
  },
  emits: { "apply-preset": null, "update:search": null, hide: null },
  setup(e, t) {
    const s = ref("");
    watchEffect(() => {
      if (e.search !== undefined) {
        s.value = e.search;
      }
    });
    return {
      searchPresetName: s,
      onSearchChange: (e) => {
        e = e.target.value;
        s.value = e;
        t.emit("update:search", e);
      },
      onItemClick: (e) => {
        t.emit("apply-preset", e.data);
      },
      onHideClick: () => {
        t.emit("hide");
      },
    };
  },
  template,
});
