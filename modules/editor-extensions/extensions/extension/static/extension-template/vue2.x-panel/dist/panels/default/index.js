var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });

const { readFileSync } = require("fs-extra");

const { join } = require("path");

const vue_1 = __importDefault(require("vue/dist/vue"));

const component = vue_1.default.extend({
  template: readFileSync(
    join(__dirname, "../../../static/template/vue/app.html"),
    "utf-8"
  ),
  data() {
    return { counter: 0 };
  },
  methods: {
    addition() {
      this.counter += 1;
    },
    subtraction() {
      --this.counter;
    },
  },
});

const panelDataMap = new WeakMap();
module.exports = Editor.Panel.define({
  listeners: {
    show() {
      console.log("show");
    },
    hide() {
      console.log("hide");
    },
  },
  template: readFileSync(
    join(__dirname, "../../../static/template/default/index.html"),
    "utf-8"
  ),
  style: readFileSync(
    join(__dirname, "../../../static/style/default/index.css"),
    "utf-8"
  ),
  $: { app: "#app", text: "#text" },
  methods: {
    hello() {
      if (this.$.text) {
        this.$.text.innerHTML = "hello";
        console.log("[cocos-panel-html.default]: hello");
      }
    },
  },
  ready() {
    var e;

    if (this.$.text) {
      this.$.text.innerHTML = "Hello Cocos.";
    }

    if (this.$.app) {
      e = new component();
      panelDataMap.set(this, e);
      e.$mount(this.$.app);
    }
  },
  beforeClose() {},
  close() {
    var e = panelDataMap.get(this);

    if (e) {
      e.$destroy();
    }
  },
});
