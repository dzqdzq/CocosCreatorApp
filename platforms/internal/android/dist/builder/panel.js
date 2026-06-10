Object.defineProperty(exports, "__esModule", { value: true });

exports.buttonConfig = undefined;
exports.getAPILevel = undefined;
exports.ready = undefined;
exports.update = undefined;
exports.$ = undefined;
exports.template = undefined;

const fs_1 = require("fs");
const path_1 = require("path");
const options_1 = require("./options");
const lodash = require("lodash");
let panel;
exports.template = fs_1.readFileSync(
  path_1.join(__dirname, "../../static/builder/view.html"),
  "utf8"
);
const methods = {
  t(e, a) {
    return Editor.I18n.t("android." + e, a);
  },
  async onSetAndroidSDK() {
    Editor.Message.send("preferences", "open-settings", "program");
  },
  getDefaultPackageName() {
    return options_1.defaultOptions.packageName || "com.test.cocos";
  },
  onNewKeyStore() {
    Editor.Panel.open("android.certificate");
  },
  async onChangeDebugKeystore(e) {
    const a = this;
    await a.onUpdateOptions("useDebugKeystore", e);
    var t = [
      "keystorePath",
      "keystorePassword",
      "keystoreAlias",
      "keystoreAliasPassword",
    ];
    if (e === true) {
      t.forEach((e) => {
        a.pkgErrorMap[e] = null;
        a.emitChange(e, a.pkgOptions[e], null);
      });
    } else {
      for (const p of t) {
        a.pkgErrorMap[p] = (
          await options_1.verificationFunc(p, a.pkgOptions[p], panel.options)
        ).error;

        a.emitChange(p, a.pkgOptions[p], a.pkgErrorMap[p]);
      }
    }
  },
  async onConfirm(e) {
    var a = e.target.value;
    var e = e.target.getAttribute("path");
    await this.onUpdateOptions(e, a);
  },
  async onRenderBackEnd(e) {
    var a = this;
    var e = e.target.value;

    a.pkgOptions.renderBackEnd = e
      ? Object.assign(a.pkgOptions.renderBackEnd, { gles3: true })
      : Object.assign(a.pkgOptions.renderBackEnd, {
          gles2: false,
          gles3: false,
        });

    await a.onUpdateOptions("renderBackEnd", a.pkgOptions.renderBackEnd);
  },
  async onUpdateOptions(e, a) {
    var t;
    var p;

    if (e) {
      t = this;
      lodash.set(t.pkgOptions, e, a);
      panel.options.packages.android = t.pkgOptions;

      e.startsWith("renderBackEnd") &&
        ((e = "renderBackEnd"), (a = t.pkgOptions.renderBackEnd));

      p = await options_1.verificationFunc(e, a, panel.options);
      t.$set(t.pkgErrorMap, e, p.error);
      t.emitChange(e, a, p.error);
    }
  },
  emitChange(e, a, t) {
    panel.dispatch("update", `packages.${this.pkgName}.` + e, a, t);
  },
  async onChangeABI(e, a) {
    var t = this;
    var e = e.target.value;

    if (!Array.isArray(t.pkgOptions.appABIs)) {
      t.pkgOptions.appABIs = [];
    }

    if (e) {
      t.pkgOptions.appABIs.push(a);
    } else {
      t.pkgOptions.appABIs.splice(t.pkgOptions.appABIs.indexOf(a), 1);
    }

    await t.onUpdateOptions("appABIs", t.pkgOptions.appABIs);
  },
  async changeInstantValue(e) {
    var a = this;
    await a.onUpdateOptions("androidInstant", e);

    if (e) {
      e = await options_1.verificationFunc(
        "remoteUrl",
        a.pkgOptions.remoteUrl,
        panel.options
      );

      a.pkgErrorMap.remoteUrl = e.error;

      e = await options_1.verificationFunc(
        "apiLevel",
        a.pkgOptions.apiLevel,
        panel.options
      );

      a.$set(a.pkgErrorMap, "apiLevel", e.error);
    } else {
      a.pkgErrorMap.remoteUrl = null;

      e = await options_1.verificationFunc(
        "apiLevel",
        a.pkgOptions.apiLevel,
        panel.options
      );

      a.$set(a.pkgErrorMap, "apiLevel", e.error);
    }

    a.emitChange("apiLevel", a.pkgOptions.apiLevel, a.pkgErrorMap.apiLevel);

    a.emitChange("remoteUrl", a.pkgOptions.remoteUrl, a.pkgErrorMap.remoteUrl);
  },
  async init() {
    var e = this;
    e.pkgOptions = lodash.get(panel.options, "packages.android") || {};
    lodash.set(panel.options, "packages.android", e.pkgOptions);
    e.apiLevels = await getAndroidAPILevels();
    e.pkgOptions.apiLevel = e.pkgOptions.apiLevel || e.apiLevels[0];
    for (const t of Object.keys(options_1.defaultOptions)) {
      var a = await options_1.verificationFunc(
        t,
        e.pkgOptions[t],
        panel.options
      );
      e.pkgErrorMap[t] = a.error;
    }

    if (!e.apiLevels.length) {
      e.pkgErrorMap.apiLevel = "i18n:android.tips.apilevel_empty";
    }

    panel.dispatch(
      "update",
      "packages." + e.pkgName,
      e.pkgOptions,
      e.pkgErrorMap
    );
  },
};
async function update(e, a) {
  panel = this;
  panel.options = e;

  if (a === "packages.native.JobSystem") {
    panel.options.packages.native.JobSystem = e.packages.native.JobSystem;
    panel.vm.onUpdateOptions("apiLevel", e.packages.android.apiLevel);
  } else if (!a || a.startsWith("packages." + panel.pkgName)) {
    panel.vm.init();
  }
}
function ready(e, a, t, p) {
  panel = this;
  var o = require("vue/dist/vue.js");
  panel.options = e;
  panel.pkgName = t;
  panel.errorMap = p;

  panel.vm = new o({
    el: panel.$.root,
    methods,
    data() {
      return {
        pkgName: t,
        options: panel.options,
        errorMap: panel.errorMap,
        pkgOptions: JSON.parse(JSON.stringify(options_1.defaultOptions)),
        pkgErrorMap: JSON.parse(JSON.stringify(options_1.defaultOptions)),
        apiLevels: [],
        appABIList: ["armeabi-v7a", "arm64-v8a", "x86", "x86_64"],
      };
    },
    mounted() {
      this.init();
    },
    components: {
      "build-prop": BuildPanel.vueComps.buildProp,
      "template-comp": BuildPanel.vueComps.templateComp,
    },
  });
}
exports.$ = { root: ".android" };
exports.update = update;
exports.ready = ready;
const MIN_COMPILE_LEVEL = 18;
async function getAndroidAPILevels() {
  var e = await Editor.Profile.getConfig("program", "android_sdk");
  const p = path_1.join(e, "platforms");
  return e && fs_1.existsSync(e) && fs_1.existsSync(p)
    ? fs_1.readdirSync(p).filter((e) => {
        var a = getAPILevel(e);
        var t = fs_1.statSync(path_1.join(p, e));
        return (!!/^android-/.test(e) && !!(a >= MIN_COMPILE_LEVEL && t.isDirectory()));
      })
    : [];
}
function getAPILevel(e) {
  e = (e = e || "").match("android-([0-9]+)$");
  let a = -1;
  return (a = e ? parseInt(e[1]) : a);
}
exports.getAPILevel = getAPILevel;

exports.buttonConfig = {
  configs: {
    make: { label: "i18n:android.make.label", hookHandle: "make" },
    run: { label: "i18n:android.run.label", hookHandle: "run" },
  },
};
