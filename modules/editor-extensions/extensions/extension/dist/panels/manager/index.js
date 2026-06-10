var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));

const { readFileSync } = require("fs");

const { join } = require("path");

const vue_js_1 = __importDefault(require("vue/dist/vue.js"));
const app_1 = require("./app");

const {
  generateSdk,
  useProvideExtensionPaths,
  useProvideSdk,
} = require("./sdk");

const { createStore, useProvideStore } = require("./store");

const event_bus_1 = require("./event-bus");

const Panel = Editor.Panel.define({
  style: readFileSync(join(__dirname, "../../manager.css"), "utf8"),
  template: '<div class="extension"></div>',
  $: { container: ".extension" },
  methods: {
    search(e) {
      if (this.vm && (typeof e == "string" || typeof e == "boolean")) {
        this.vm.$emit(event_bus_1.INTERNAL_EVENTS.search, e);
      }
    },
    selectPackage(e) {},
  },
  async ready(e = {}) {
    const { extensionPaths, sdk } = await generateSdk();
    const r = createStore(sdk);
    r.startupParams.value = e;
    this.vm?.$destroy();
    e = new vue_js_1.default({
      name: "ExtensionManagerProvider",
      setup(e, t) {
        useProvideStore(r);
        useProvideExtensionPaths(extensionPaths);
        useProvideSdk(sdk);
        return {};
      },
      render(e) {
        return e(app_1.PanelApp, { ref: "app" });
      },
    }).$mount(this.$.container);
    this.vm = e;
  },
  async close() {
    this.vm?.$destroy();
    delete this.vm;

    if (app_1.updateExtensionOption.isReRegister) {
      await Editor.Package.unregister(app_1.updateExtensionOption.path);
      await Editor.Package.register(app_1.updateExtensionOption.path);
      await Editor.Package.enable(app_1.updateExtensionOption.path);
    }
  },
});

module.exports = Panel;
