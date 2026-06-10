var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyframeBtn = undefined;
const vue_js_1 = __importDefault(require("vue/dist/vue.js"));

const template = `
  <div class="keyframe-btn">
      <div class="keyframe-btn__key" :class="keyClasses"></div>
  </div>
`;

exports.KeyframeBtn = vue_js_1.default.extend({
  name: "KeyframeBtn",
  props: { empty: { type: Boolean, default: true } },
  computed: {
    keyClasses() {
      return { empty: this.empty };
    },
  },
  template,
});
