function data() {
  return { isOpen: false, label: "" };
}
function mounted() {
  const t = this;

  if (!t.label) {
    t.label = t.options.find((e) => e.name === t.value)?.label;
  }
}
Object.defineProperty(exports, "__esModule", { value: true });

exports.methods = undefined;
exports.watch = undefined;
exports.computed = undefined;
exports.props = undefined;
exports.template = undefined;
exports.name = undefined;

exports.data = data;
exports.mounted = mounted;
exports.name = "view-select";

exports.template = `
<div class="view-select-container" tabindex="-1"
    @mousedown.prevent
    @focus.prevent="activate()"
    @blur.prevent="deActivate()"
    @keyup.esc="deActivate()"
>
    <div class="view-select" @click="toggle">
        <input type="hidden" :value="value">
        <div class="label">
            <span v-show="!value" id="placeholder">{{ placeholder }}</span>
            <span v-show="value">{{ label }}</span>
        </div>
        <ui-icon class="arrow-triangle" value="arrow-triangle"></ui-icon>
    </div>
    <div v-show="isOpen" class="options">
        <ul>
            <li
                v-for="(item, index) in options"
                :key="index"
                :class="{ selected: value === item.name, separator: '__separator__' === item.name }"
                @click.stop="selectItem(item)"
            >
                {{ item.label }}
            </li>
            <li v-show="options.length === 0">
                <span class="no_options"><slot name="noOptions"></slot></span>
            </li>
        </ul>
    </div>
</div>
`;

exports.props = {
  disable: { type: Boolean, default: false },
  options: {
    type: Array,
    default() {
      return [];
    },
  },
  value: { type: [String, Number], default: "" },
  placeholder: { type: String, default: "" },
};

exports.computed = {};

exports.watch = {
  value(t) {
    this.label = this.options.find((e) => e.name === t)?.label;
  },
  options(e) {
    const t = this;
    let s = e.find((e) => e.name === t.value);

    if (s) {
      t.label = s?.label;
    } else {
      s = e[0];
      this.selectItem(e[0]);
    }
  },
};

exports.methods = {
  toggle() {
    var e = this;

    if (e.isOpen) {
      e.deActivate();
    } else {
      e.activate();
    }
  },
  activate() {
    var e = this;

    if (!e.isOpen) {
      e.isOpen = true;
      e.$el.focus();
    }
  },
  deActivate() {
    var e = this;

    if (e.isOpen) {
      e.isOpen = false;
      e.$el.blur();
    }
  },
  selectItem(e) {
    this.$emit("change", e.name);
    this.isOpen = false;
  },
};
