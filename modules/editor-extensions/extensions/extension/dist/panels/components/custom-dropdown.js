var __importDefault =
  (this && this.__importDefault) ||
  ((t) => (t && t.__esModule ? t : { default: t }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomDropdown = undefined;
exports.CustomDropdownItem = undefined;
const vue_js_1 = __importDefault(require("vue/dist/vue.js"));

const { containsEventTarget } = require("../../public/utils-dom");

const optionTemplate = `
  <div
      class="custom-dropdown-item"
      :class="{
          active: active === true,
      }"
      @click="onItemClick"
  >
      <slot> {{ label }} </slot>
  </div>
`;

exports.CustomDropdownItem = vue_js_1.default.extend({
  name: "CustomDropdownItem",
  inject: { customDropdown: { from: "customDropdown" } },
  props: {
    label: { type: String, default: undefined },
    active: { type: Boolean, default: undefined },
    onClick: { type: Function, default: undefined },
  },
  data() {
    return {};
  },
  methods: {
    getDropdownVm() {
      var t = this.customDropdown;
      if (t == null) {
        throw new Error("injected customDropdown component not found");
      }
      return t;
    },
    onItemClick(t) {
      this.getDropdownVm().updateVisible(false);

      if (typeof this.onClick == "function") {
        this.onClick(t);
      } else {
        this.$emit("click", t);
      }
    },
  },
  template: optionTemplate,
});

const dropdownTemplate = `
<div
    ref="dropdown"
    class="custom-dropdown"
    :class="{
        visible: sVisible,
        ['size-' + size]: true,
    }"
>
    <ui-button-group class="custom-dropdown__content">
        <slot>
            <!-- dropdown content -->
        </slot>

        <ui-button tabindex="-1" class="custom-dropdown__trigger" @click="onIconClick">
            <slot name="icon">
                <ui-icon value="arrow-triangle"></ui-icon>
            </slot>
        </ui-button>
    </ui-button-group>

    <div ref="overlay" class="custom-dropdown__overlay" :style="overlayStyle" :class="overlayClass">
        <slot name="overlay">
            <CustomDropdownItem
                v-for="item in options"
                :key="item.label"
                class="custom-dropdown__option"
                @click="onChildClick(item)"
            >
                <ui-label :value="'i18n:extension.manager.'+item.label"></ui-label>
            </CustomDropdownItem>
        </slot>
    </div>
</div>
`;

exports.CustomDropdown = vue_js_1.default.extend({
  name: "CustomDropdown",
  components: { CustomDropdownItem: exports.CustomDropdownItem },
  provide() {
    return { customDropdown: this };
  },
  props: {
    visible: { type: Boolean, default: false },
    trigger: { type: String, default: "click" },
    options: { type: Array, default: () => [] },
    overlayStyle: { type: Object, default: undefined },
    overlayClass: { type: [String, Object, Array], default: undefined },
    size: { type: String, default: "default" },
  },
  data() {
    return { sVisible: this.visible };
  },
  computed: {},
  watch: {
    visible: {
      handler(t, e) {
        this.sVisible = t;
      },
      immediate: true,
    },
  },
  mounted() {
    document.body.addEventListener("click", this.onDocumentClick);
  },
  beforeDestroy() {
    document.body.removeEventListener("click", this.onDocumentClick);
  },
  methods: {
    updateVisible(t) {
      t = typeof t == "boolean" ? t : !this.sVisible;
      this.sVisible = t;
      this.$emit("update:visible", t);
    },
    onIconClick(t) {
      if (this.trigger === "click") {
        this.updateVisible();
      }
    },
    onChildClick(t) {
      if (t.onClick) {
        t.onClick(t);
      } else {
        this.$emit("select", t);
      }
    },
    onDocumentClick(t) {
      if (
        this.trigger === "click" &&
        this.sVisible === true &&
        !containsEventTarget(this.$refs.dropdown, t)
      ) {
        this.updateVisible(false);
      }
    },
  },
  template: dropdownTemplate,
});
