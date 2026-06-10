Object.defineProperty(exports, "__esModule", { value: true });

const { readFileSync } = require("fs");

const { join } = require("path");

const Vue = require("vue/dist/vue.js");

Vue.config.productionTip = false;
Vue.config.devtools = false;
const panelDataMap = new WeakMap();

const app_1 = require("./app");
const utils_build_1 = require("../../public/utils-build");
module.exports = Editor.Panel.define({
  template: '<div id="app"></div>',
  style: readFileSync(join(__dirname, "../../create.css"), "utf8"),
  $: { app: "#app" },
  async ready(e) {
    var t = await Editor.Message.request("extension", "get-extension-info-map");

    var a =
      (await Editor.Profile.getTemp(
        "extension",
        utils_build_1.TempProfileKeys.author
      )) || "Cocos Creator";

    var o = await Editor.Profile.getTemp(
      "extension",
      utils_build_1.TempProfileKeys.showInManager
    );

    var o = o === null || Boolean(o);

    var i = await Editor.Profile.getTemp(
      "extension",
      utils_build_1.TempProfileKeys.showInFolder
    );

    var i = i === null || Boolean(i);
    const n = new Vue({
      extends: app_1.ExtensionCreation,
      propsData: {
        showInFolder: i,
        showInManager: o,
        author: a,
        preloadExtensionInfo: t,
      },
    });
    function l(e) {
      if (n) {
        n.onPluginEnable(e);
      }
    }
    function r(e) {
      if (n) {
        n.onPluginDisable(e);
      }
    }
    (this.vm = n).$mount(this.$.app);

    if (
      e?.selectedTemplate &&
      (({ packageName: i, templatePath: o } = e.selectedTemplate),
      (a = n.getAvailableTemplate(i, o)))
    ) {
      n.selectTemplate(i, a);
    }

    n.loadAllCreatorModule({ force: true });
    Editor.Package.__protected__.on("enable", l);
    Editor.Package.__protected__.on("disable", r);

    panelDataMap.set(this, {
      onExtensionDisable: r,
      onExtensionEnable: l,
      async releaseAllCreatorModule() {
        return n.unloadAllCreatorModule();
      },
    });
  },
  async close() {
    var e = panelDataMap.get(this);

    if (e) {
      await e.releaseAllCreatorModule();

      Editor.Package.__protected__.removeListener(
        "enable",
        e.onExtensionEnable
      );

      Editor.Package.__protected__.removeListener(
        "disable",
        e.onExtensionDisable
      );
    }

    panelDataMap.delete(this);
    this.vm?.$destroy();
    delete this.vm;
  },
});
