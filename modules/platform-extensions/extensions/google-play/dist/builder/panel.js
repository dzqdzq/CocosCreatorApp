Object.defineProperty(exports, "__esModule", { value: true });
exports.$ = undefined;
exports.template = undefined;
exports.style = undefined;
exports.update = update;
exports.ready = ready;
exports.getAPILevel = getAPILevel;

const { readFileSync, existsSync, readdirSync, statSync } = require("fs-extra");

const { join } = require("path");

const options_1 = require("./options");

const { verificationFunc } = options_1;

const { getDisplayCustomIcon, saveCustomIcon } = require("./customIcon");

const lodash = require("lodash");
let panel;

exports.style = `
.set-androidSDK,
.new-keystore {
    margin-left: 4px;
}
.row {
    margin-bottom: 4px;
}

.custom-icon-container {
    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;
    align-items: center;
}
.custom-icon-container > .button-select-image {
    width: 100%;
}
.custom-icon-container > .display-icon-container {
    position: relative;
    height: 130px;
}
.custom-icon-container > .display-icon-container > ui-image {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    height: 120px;
    width: 120px;
}
`;

exports.template = readFileSync(
  join(__dirname, "../../static/builder/view.html"),
  "utf8"
);

const MaxAspectRatioList = [
  { label: "2.4 (12:5)", value: "2.4" },
  { label: "1.77 (16:9)", value: "16:9" },
  { label: "1.6 (16:10)", value: "16:10" },
  { label: "1.33 (4:3)", value: "4:3" },
];

const parseAspectRationValue = (e) => {
  var t;
  return e
    ? (t = e.match(/^(\d+):(\d+)$/))
      ? Number.parseInt(t[1], 10) / Number.parseInt(t[2], 10)
      : Number.parseFloat(e)
    : 0;
};

const methods = {
  t(e, t) {
    return Editor.I18n.t("android." + e, t);
  },
  async onSetAndroidSDK() {
    Editor.Message.send("preferences", "open-settings", "program");
  },
  getDefaultPackageName() {
    return options_1.defaultOptions.packageName || "com.test.cocos";
  },
  onNewKeyStore() {
    Editor.Panel.open("certificate", "android");
  },
  async onChangeDebugKeystore(e) {
    const t = this;
    await t.onUpdateOptions("useDebugKeystore", e);
    var a = [
      "keystorePath",
      "keystorePassword",
      "keystoreAlias",
      "keystoreAliasPassword",
    ];
    if (e === true) {
      a.forEach((e) => {
        t.pkgErrorMap[e] = null;
        t.emitChange(e, t.pkgOptions[e], null);
      });
    } else {
      for (const o of a) {
        t.pkgErrorMap[o] = (
          await verificationFunc(o, t.pkgOptions[o], panel.options)
        ).error;

        t.emitChange(o, t.pkgOptions[o], t.pkgErrorMap[o]);
      }
    }
  },
  async onRenderBackEnd(e) {
    var t = this;
    var e = e.target.value;

    t.pkgOptions.renderBackEnd = e
      ? Object.assign(t.pkgOptions.renderBackEnd, { gles3: true })
      : Object.assign(t.pkgOptions.renderBackEnd, {
          gles2: false,
          gles3: false,
        });

    await t.onUpdateOptions("renderBackEnd", t.pkgOptions.renderBackEnd);
  },
  async onChange(e) {
    var t = e.target.value;
    var e = e.target.getAttribute("path");
    await this.onUpdateOptions(e, t);
  },
  async onUpdateOptions(e, t) {
    var a;
    var o;

    if (e) {
      a = this;
      lodash.set(a.pkgOptions, e, t);
      panel.options.packages["google-play"] = a.pkgOptions;

      e.startsWith("renderBackEnd") &&
        ((e = "renderBackEnd"), (t = a.pkgOptions.renderBackEnd));

      e === "apiLevel" && (t = Number(t));
      o = await verificationFunc(e, t, panel.options);
      a.pkgErrorMap[e] = o.error;
      a.emitChange(e, t, o.error);
    }
  },
  emitChange(e, t, a) {
    panel.dispatch("update", `packages.${this.pkgName}.` + e, t, a);
  },
  async changeMaxAspectRatio(e) {
    var t = this;
    let a = e.target.value;
    e = e.target.getAttribute("path");

    if (e === "maxAspectRatio") {
      a = "custom" !== (t.maxAspectRatio = a) ? a : t.customMaxAspectRatio;
    } else if (e === "customMaxAspectRatio") {
      t.customMaxAspectRatio = a;
    }

    await t.onUpdateOptions("maxAspectRatio", a);
  },
  async onChangeABI(e, t) {
    var a = this;
    var e = e.target.value;

    if (!Array.isArray(a.pkgOptions.appABIs)) {
      a.pkgOptions.appABIs = [];
    }

    if (e) {
      a.pkgOptions.appABIs.push(t);
    } else {
      a.pkgOptions.appABIs.splice(a.pkgOptions.appABIs.indexOf(t), 1);
    }

    await a.onUpdateOptions("appABIs", a.pkgOptions.appABIs);
  },
  async changeInstantValue(e) {
    var t = this;

    var a =
      ((t.pkgOptions.androidInstant = e)
        ? ((a = await verificationFunc(
            "remoteUrl",
            t.pkgOptions.remoteUrl,
            panel.options
          )),
          (t.pkgErrorMap.remoteUrl = a.error))
        : (t.pkgErrorMap.remoteUrl = null),
      await verificationFunc("apiLevel", t.pkgOptions.apiLevel, panel.options));

    t.pkgErrorMap.apiLevel = a.error;

    if (!t.apiLevels.length) {
      t.pkgErrorMap.apiLevel = "i18n:google-play.tips.apilevel_empty";
    }

    t.emitChange("androidInstant", e);
    t.emitChange("apiLevel", t.pkgOptions.apiLevel, t.pkgErrorMap.apiLevel);

    t.emitChange("remoteUrl", t.pkgOptions.remoteUrl, t.pkgErrorMap.remoteUrl);
  },
  updateDisplayCustomIcon(e) {
    var t = this;
    t.displayCustomIcon =
      e || getDisplayCustomIcon(t.pkgOptions.customIcon, t.outputName);
  },
  async changeCustomIconType(e) {
    await this.onUpdateOptions("customIcon", e);
    this.updateDisplayCustomIcon();
  },
  async onSelectImage(e) {
    var t = (
      await Editor.Dialog.select({
        type: "file",
        multi: false,
        filters: [{ extensions: ["png"], name: "Image" }],
      })
    ).filePaths[0];

    if (t) {
      await saveCustomIcon(t, "custom", this.outputName);
      await this.changeCustomIconType("custom");
    }
  },
  async init() {
    var e = this;
    e.pkgOptions = lodash.get(panel.options, "packages.google-play") || {};
    e.apiLevels = await getAndroidAPILevels();
    e.pkgOptions.apiLevel = e.pkgOptions.apiLevel || e.apiLevels[0];
    e.pkgOptions.resizeableActivity = e.pkgOptions.resizeableActivity ?? true;
    for (const a of Object.keys(options_1.defaultOptions)) {
      var t = await verificationFunc(a, e.pkgOptions[a], panel.options);
      e.pkgErrorMap[a] = t.error;
    }

    if (!e.apiLevels.length) {
      e.pkgErrorMap.apiLevel = "i18n:google-play.tips.apilevel_empty";
    }

    panel.dispatch(
      "update",
      "packages." + e.pkgName,
      e.pkgOptions,
      e.pkgErrorMap
    );
  },
};

async function update(e, t) {
  panel = this;
  panel.options = e;

  if (t === "packages.native.JobSystem") {
    panel.options.packages.native.JobSystem = e.packages.native.JobSystem;

    panel.vm.onUpdateOptions("apiLevel", e.packages["google-play"].apiLevel);
  } else if (!t || t.startsWith("packages." + panel.pkgName)) {
    panel.options = e;
    panel.vm.init();
  }
}
function ready(e, t, a, o) {
  panel = this;
  var p = require("vue/dist/vue.js");
  panel.options = e;
  panel.pkgName = a;
  panel.errorMap = o;

  panel.vm = new p({
    el: panel.$.root,
    data() {
      return {
        pkgName: a,
        type: t,
        pkgOptions: options_1.defaultOptions,
        pkgErrorMap: options_1.defaultOptions,
        apiLevels: [],
        appABIList: ["armeabi-v7a", "arm64-v8a", "x86", "x86_64"],
        maxAspectRatioOptions: MaxAspectRatioList,
        maxAspectRatio: "",
        customMaxAspectRatio: "",
        outputName: e.outputName,
        displayCustomIcon: "",
      };
    },
    async mounted() {
      var e = this;

      if (e.type === "check") {
        e.pkgOptions = lodash.get(panel.options, "packages.android") || {};
        e.apiLevels = e.pkgOptions.apiLevel && [e.pkgOptions.apiLevel];
        e.pkgErrorMap = {};
      } else {
        e.init();
        e.updateDisplayCustomIcon();
        initMaxAspectRatio(e);
      }
    },
    methods,
  });
}
function initMaxAspectRatio(t) {
  var e = t.pkgOptions.maxAspectRatio;
  if (e !== undefined) {
    const o = parseAspectRationValue(e);
    var a = MaxAspectRatioList.filter(
      (e) => parseAspectRationValue(e.value) === o
    );
    t.maxAspectRatio = a.length ? a[0].value : "custom";
  } else {
    t.maxAspectRatio = MaxAspectRatioList[0].value;
  }
  if (t.maxAspectRatio === "custom" && e) {
    a = e.match(/^(\d+):(\d+)$/);
    if (a) {
      const p = Number.parseInt(a[1]);
      const s = Number.parseInt(a[2]);
      t.$nextTick(() => {
        var e = `${(p / s).toFixed(2)} (${p}:${s})`;
        t.customMaxAspectRatio = e;
      });
    } else {
      t.customMaxAspectRatio = e;
    }
  }
}
exports.$ = { root: ".google-play" };
const MIN_COMPILE_LEVEL = 19;
async function getAndroidAPILevels() {
  var e = await Editor.Message.request(
    "program",
    "query-program-info",
    "androidSDK"
  );
  if (!e || !e.path || !existsSync(e.path)) {
    return [];
  }
  const o = join(e.path, "platforms");
  return existsSync(o)
    ? readdirSync(o)
        .filter((e) => {
          var t = getAPILevel(e);
          var a = statSync(join(o, e));
          return (!!/^android-/.test(e) && !!(t >= MIN_COMPILE_LEVEL && a.isDirectory()));
        })
        .map((e) => parseInt(e.split("-")[1]))
    : [];
}
function getAPILevel(e) {
  e = (e = e || "").match("android-([0-9]+)$");
  let t = -1;
  return (t = e ? parseInt(e[1]) : t);
}
