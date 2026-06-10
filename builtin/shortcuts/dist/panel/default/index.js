var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });

const { join } = require("path");

const { readFileSync, readJSONSync } = require("fs-extra");

const shortcutPanelVue_1 = __importDefault(require("./shortcutPanelVue"));
let vm;
module.exports = Editor.Panel.define({
  style: readFileSync(join(__dirname, "./index.css"), "utf8"),
  template: '<div class="container"></div>',
  $: { container: ".container" },
  methods: {
    changeTab(e, t) {
      if (vm && ((vm.active = e), vm.map[vm.active][t])) {
        vm.msg = vm.map[vm.active][t];
      }
    },
    onShortcutChanged() {
      if (vm) {
        vm.updateShortcutMap();
      }
    },
  },
  ready(e = "") {
    vm?.$destroy();

    vm = new shortcutPanelVue_1.default({
      propsData: {
        qwertyKeys: readJSONSync(
          join(__dirname, "../../../static", "keyboard/qwerty.json")
        ),
      },
    });

    if (e) {
      vm.active = e;
    }

    vm.$mount(this.$.container);
  },
  close() {
    vm?.$destroy();
    vm = null;
  },
});
