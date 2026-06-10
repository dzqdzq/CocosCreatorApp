var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.TabDropdown = undefined;
const vue_js_1 = __importDefault(require("vue/dist/vue.js"));
const custom_dropdown_1 = require("./custom-dropdown");

const template = `
  <div ref="tab" class="tab-dropdown" :active="activeLabel === nativeLabel">
      <CustomDropdown v-if="children" :visible.sync="showDropdown">
          <ui-button class="tab-dropdown__btn" @click="onTabClick">
              <ui-label :value="'i18n:extension.manager.'+ presentLabel"></ui-label>
          </ui-button>

          <template #overlay="">
              <CustomDropdownItem
                  v-for="item in children"
                  :key="item.label"
                  :active="item.label === activeLabel"
                  class="option"
                  @click="onChildClick(item, $event)"
              >
                  <ui-label :value="'i18n:extension.manager.'+item.label"></ui-label>
              </CustomDropdownItem>
          </template>
      </CustomDropdown>

      <ui-button v-else class="tab-dropdown__btn" @click="onTabClick">
          <ui-label :value="'i18n:extension.manager.'+ label"></ui-label>
      </ui-button>
  </div>
`;

exports.TabDropdown = vue_js_1.default.extend({
  name: "TabDropdown",
  components: {
    CustomDropdown: custom_dropdown_1.CustomDropdown,
    CustomDropdownItem: custom_dropdown_1.CustomDropdownItem,
  },
  props: {
    activeLabel: { type: String, required: true },
    label: { type: String, required: true },
    children: { type: Array, default: undefined },
  },
  data() {
    return { showDropdown: false, nativeLabel: this.label };
  },
  computed: {
    presentLabel() {
      return this.nativeLabel ?? this.label;
    },
  },
  watch: {
    activeLabel: {
      handler(e, t) {
        if (e === this.label || this.isChildLabel(e)) {
          this.nativeLabel = e;
        }
      },
      immediate: true,
    },
  },
  mounted() {},
  beforeDestroy() {},
  methods: {
    isChildLabel(t) {
      var e = this.children;
      return (
        !(!Array.isArray(e) || e.length < 1) &&
        e.find((e) => e.label === t) != null
      );
    },
    onTabClick() {
      this.$emit("select", this.nativeLabel);
      this.toggleDropdown(false);
    },
    onChildClick(e, t) {
      this.nativeLabel = e.label;
      this.$emit("select", e.label);
    },
    toggleDropdown(e) {
      this.showDropdown = typeof e == "boolean" ? e : !this.showDropdown;
    },
  },
  template,
});
