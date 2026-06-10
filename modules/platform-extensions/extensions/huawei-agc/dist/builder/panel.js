Object.defineProperty(exports, "__esModule", { value: true });
exports.$ = undefined;
exports.template = undefined;
exports.update = update;
exports.ready = ready;

const { existsSync } = require("fs");

const { copySync, readFileSync } = require("fs-extra");

const { extname, join } = require("path");

const lodash = require("lodash");
const util_1 = require("./util");

const { getNameFromConfig } = util_1;

let panel;

const EMPTY_PLUGIN = {
  id: "0",
  name: Editor.I18n.t("huawei-agc.empty_plugin_name"),
  plugins: [],
};

const PLUGIN_ENUM = { android: "1", ios: "2", agc: "3" };
function data() {
  return {
    selected: null,
    config: [],
    serviceConfigPath: "",
    pkgOptions: {},
    pkgErrorMap: {},
  };
}

const computed = {
  currentSelect() {
    var e = this;
    if (e.selected) {
      for (const a in e.config) {
        if (e.config[a].id === e.selected) {
          return e.config[a];
        }
      }
    }
    return null;
  },
};

const methods = {
  t(e) {
    return Editor.I18n.t("huawei-agc." + e);
  },
  async updateAGConnectConfigPath(e) {
    var a = this;
    var t = e.target.value;

    if (t && existsSync(t) && extname(t) === ".json") {
      t !== util_1.HUAWEI_CONFIG_PATH && copySync(t, util_1.HUAWEI_CONFIG_PATH);

      a.pkgOptions.serviceConfigPath = util_1.HUAWEI_CONFIG_PATH;
      a.pkgErrorMap = {};
      e.target.value = util_1.HUAWEI_CONFIG_PATH;
      a.checkPackageName();
    } else {
      lodash.set(a.pkgOptions, "serviceConfigPath", t);
      a.pkgErrorMap.serviceConfigPath = "i18n:huawei-agc.service_config_empty";
    }

    a.emitChange();
  },
  emitChange() {
    panel.dispatch(
      "update",
      "packages." + panel.pkgName,
      this.pkgOptions,
      this.pkgErrorMap
    );
  },
  async updateOptions(e) {
    this.selected = e;
    this.emitChange();
  },
  updateData(e, a) {
    lodash.set(this.pkgOptions, e, a);
    this.emitChange();
  },
  init() {
    var e = this;

    var a =
      lodash.get(panel.options, "packages." + panel.options.platform) || {};

    var t =
      lodash.get(panel.errorMap, "packages." + panel.options.platform) || {};

    a.serviceConfigPath = util_1.HUAWEI_CONFIG_PATH;
    t.serviceConfigPath = "";

    if (
      BuildPanel.validator.checkWithInternalRule(
        "required",
        util_1.HUAWEI_CONFIG_PATH
      ) &&
      BuildPanel.validator.checkWithInternalRule(
        "pathExist",
        util_1.HUAWEI_CONFIG_PATH
      )
    ) {
      e.checkPackageName();
    } else {
      a.serviceConfigPath = "";
      t.serviceConfigPath = "i18n:huawei-agc.service_config_empty";
    }

    e.pkgOptions = a;
    e.pkgErrorMap = t;
    e.emitChange();
  },
  checkPackageName() {
    var e = getNameFromConfig();

    if (e && e !== panel.options.packages.android.packageName) {
      panel.dispatch("update", "packages.android.packageName", e, "");
    }
  },
  parseConfig(e) {
    return this.paramValid(e)
      ? this.t("plugin_config")
      : this.t("plugin_not_config");
  },
  paramValid(e) {
    return e.hasParam;
  },
  async loadConfig() {
    var e = this;
    let a =
      (await Editor.Profile.getProject("cocos-sdkhub", "configSet")) || [];
    for (const t in (a = a.filter((e) => e.platform === PLUGIN_ENUM.agc))) {
      await this.queryDisplayName(a[t]);
    }
    a.unshift(EMPTY_PLUGIN);
    e.config = a;

    e.selected = (await this.checkConfigExists())
      ? await Editor.Profile.getConfig(
          panel.pkgName,
          `options.${panel.pkgName}.sdkhub`
        )
      : e.config.length > 0
      ? e.config[0].id
      : null;
  },
  async queryDisplayName(e) {
    try {
      var a = await Editor.Message.request(
        "cocos-services",
        "plugin-messages",
        "sdkhub:plugins-type",
        e.id
      );
      if (a) {
        for (const n in a) {
          var t = a[n];

          var i = e.plugins.find((e) => e.pId === n);

          if (i) {
            i.pName += t;
          }
        }
      }
    } catch (e) {}
  },
  async checkConfigExists() {
    const a = await Editor.Profile.getConfig(
      panel.pkgName,
      `options.${panel.pkgName}.sdkhub`
    );
    return !!this.config.find((e) => e.id === a);
  },
};

const watch = {
  selected(e) {
    this.updateData("sdkhub", e);
  },
};

function mounted() {
  this.init();
}
function update(e, a) {
  panel = this;

  if (
    !a ||
    a.startsWith("packages." + panel.pkgName) ||
    a === "packages.android.packageName"
  ) {
    panel.options = e;
    panel.vm && panel.vm.init();
  }
}
function ready(e, a, t, i) {
  panel = this;
  var n = require("vue/dist/vue.js");
  panel.options = e;
  panel.pkgName = t;

  panel.vm = new n({
    el: panel.$.root,
    data,
    computed,
    watch,
    mounted,
    methods,
  });
}

exports.template = readFileSync(
  join(__dirname, "../../static/builder/view.html"),
  "utf8"
);

exports.$ = { root: ".huawei-agc" };
