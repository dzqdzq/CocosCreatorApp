var __importDefault =
  (this && this.__importDefault) ||
  ((t) => (t && t.__esModule ? t : { default: t }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeparateBox = undefined;
const vue_js_1 = __importDefault(require("vue/dist/vue.js"));
exports.SeparateBox = vue_js_1.default.extend({
  name: "SeparateBox",
  props: {
    initPos: { type: Number, default: 400 },
    showSeparate: { type: Boolean, default: true },
    separeteLineHeight: { type: Number, default: 10 },
  },
  data() {
    return { resizeObserver: null, clientHeight: 0, h_top: 0, clientYCache: 0 };
  },
  computed: {
    h_bottom() {
      return this.showSeparate
        ? this.clientHeight - this.h_top - this.separeteLineHeight
        : 0;
    },
  },
  watch: {
    showSeparate() {
      this.init();
    },
  },
  mounted() {
    this.init();

    this.resizeObserver = new ResizeObserver(([t]) => {
      var t = t.contentRect.height;
      var e = this.h_top / this.clientHeight;

      if (this.clientHeight !== t) {
        this.clientHeight = t;
        this.h_top = this.showSeparate ? Math.floor(t * e) : t;
      }
    });

    this.resizeObserver.observe(this.$el);
  },
  beforeDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  },
  methods: {
    init() {
      this.h_top = this.showSeparate
        ? Math.floor(Math.min(this.initPos, 0.8 * this.clientHeight))
        : this.clientHeight;
    },
    mousedown(t) {
      t.stopPropagation();
      this.clientYCache = t.clientY;
    },
    mousemove(t) {
      var e;

      if (this.clientYCache !== 0) {
        e = t.clientY - this.clientYCache;
        this.h_top += e;
        this.clientYCache = t.clientY;
        this.$emit("change", { top: this.h_top });
      }
    },
    mouseup() {
      this.clientYCache = 0;
    },
  },
  render(t) {
    return t(
      "div",
      {
        class: "separate-box",
        on: { mousemove: this.mousemove, mouseup: this.mouseup },
        attrs: { "data-height": this.clientHeight },
      },
      [
        t(
          "div",
          {
            style: { height: this.h_top + "px" },
            attrs: { "data-slot": "top" },
          },
          this.$scopedSlots.top?.({ height: this.h_top })
        ),
        this.showSeparate
          ? t("div", {
              class: "line",
              style: {
                height: this.separeteLineHeight + "px",
                "--height": this.separeteLineHeight + "px",
              },
              on: { mousedown: this.mousedown, mouseup: this.mouseup },
            })
          : null,
        t(
          "div",
          {
            style: { flex: 1 },
            attrs: {
              "data-slot": "bottom",
              "data-height": this.h_bottom + "px",
            },
          },
          this.$scopedSlots.bottom?.({ height: this.h_bottom })
        ),
      ]
    );
  },
});
