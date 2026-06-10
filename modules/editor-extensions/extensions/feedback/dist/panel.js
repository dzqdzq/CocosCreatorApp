var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });

const { readFileSync } = require("fs-extra");

const { join } = require("path");

const app_1 = __importDefault(require("./app"));
const weakMap = new WeakMap();

const Panel = Editor.Panel.define({
  template: '<div id="app"></div>',
  $: { root: "#app" },
  style: readFileSync(join(__dirname, "../static/panel.css"), "utf8"),
  ready() {
    if (this.$.root) {
      let e = weakMap.get(this);

      if (e) {
        e.$destroy();
      }

      (e = new app_1.default()).$mount(this.$.root);
      weakMap.set(this, e);
    }
  },
  close() {
    weakMap.get(this)?.$destroy();
  },
});

exports.default = Panel;
