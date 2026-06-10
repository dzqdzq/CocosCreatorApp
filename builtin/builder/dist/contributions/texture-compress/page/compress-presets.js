var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, o, r = o) => {
        var i = Object.getOwnPropertyDescriptor(t, o);

        if (
          !i ||
          (!("get" in i) ? !i.writable && !i.configurable : t.__esModule)
        ) {
          i = {
            enumerable: true,
            get() {
              return t[o];
            },
          };
        }

        Object.defineProperty(e, r, i);
      }
    : (e, t, o, r) => {
        e[(r = r === undefined ? o : r)] = t[o];
      });

var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? (e, t) => {
        Object.defineProperty(e, "default", { enumerable: true, value: t });
      }
    : (e, t) => {
        e.default = t;
      });

var __importStar =
  (this && this.__importStar) ||
  (() => {
    var i = (e) =>
      (i =
        Object.getOwnPropertyNames ||
        ((e) => {
          var t;
          var o = [];
          for (t in e) {
            if (Object.prototype.hasOwnProperty.call(e, t)) {
              o[o.length] = t;
            }
          }
          return o;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var t = {};
      if (e != null) {
        for (var o = i(e), r = 0; r < o.length; r++) {
          if (o[r] !== "default") {
            __createBinding(t, e, o[r]);
          }
        }
      }
      __setModuleDefault(t, e);
      return t;
    };
  })();

var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));

Object.defineProperty(exports, "__esModule", { value: true });

exports.methods = undefined;
exports.computed = undefined;
exports.props = undefined;
exports.data = undefined;
exports.components = undefined;
exports.template = undefined;

exports.created = created;
exports.mounted = mounted;

const { readFileSync, readJSONSync, outputFile } = require("fs-extra");

const { join } = require("path");

const lodash_1 = __importDefault(require("lodash"));
const compressConfig = __importStar(require("../comp/texture-compress-config"));
const configToolbar = __importStar(require("../comp//config-toolbar"));

const { checkCompressOptions } = require("../../../share/utils");

exports.template = readFileSync(
  join(__dirname, "../../../../static/contributions/compress-presets.html"),
  "utf8"
);

exports.components = {
  "compress-config": compressConfig,
  "config-toolbar": configToolbar,
};

const data = () => ({
  configs: null,
  defaultConfig: null,
  initialized: false,
  searchName: "",
});

function created() {
  this.throttledBroadcastUpdated = this.broadcastUpdated.bind(this);
}
async function mounted() {
  console.time("Init presets");
  await this.init();
  console.timeEnd("Init presets");
}
exports.data = data;
exports.props = ["compressConfig", "overwriteFormats"];

exports.computed = {
  displayConfigs() {
    const t = this;
    const o = {};

    Object.keys(t.configs).forEach((e) => {
      if (t.configs[e] && t.configs[e].name.includes(t.searchName)) {
        o[e] = t.configs[e];
      }
    });

    return o;
  },
};

exports.methods = {
  t(e) {
    return Editor.I18n.t("builder.project.texture_compress." + e);
  },
  async init() {
    var e = this;

    var t = await Editor.Profile.getProject(
      "builder",
      "textureCompressConfig.userPreset"
    );

    if (t) {
      e.configs = t;
    }

    e.defaultConfig = await Editor.Profile.getProject(
      "builder",
      "textureCompressConfig.defaultConfig"
    );

    e.mode = await Editor.Profile.getProject(
      "builder",
      "textureCompressConfig.userPresetMode"
    );

    e.initialized = true;
  },
  async onToolBarChange(e, t) {
    var o = this;
    switch (e) {
      case "add-config": {
        o.addConfig(t);
        break;
      }
      case "import-config": {
        o.importConfig();
        break;
      }
      case "export-config": {
        o.exportConfig();
        break;
      }
      case "search-name": {
        o.searchName = t;
      }
    }
  },
  async addConfig(e) {
    const t = this;
    const o = Editor.Utils.UUID.generate();
    let r;

    if (e) {
      r = e && JSON.parse(JSON.stringify(t.configs[e]));
      r.name = "(copy)";
    } else {
      r = { name: "New Compress Config", options: {} };
    }

    t.$set(t.configs, o, r);

    await Editor.Profile.setProject(
      "builder",
      "textureCompressConfig.userPreset." + o,
      r
    );

    t.throttledBroadcastUpdated();

    process.nextTick(() => {
      t.jumpToConfig(o);
    });
  },
  jumpToConfig(e) {
    if (this.$refs.wrap) {
      const t = this.$refs.wrap.querySelector(`ui-section[id="${e}"]`);

      if (t) {
        t.scrollIntoView();
        t.setAttribute("twinkle", "shake");

        setTimeout(() => {
          t.setAttribute("twinkle", "");
        }, 900);
      }
    }
  },
  async onUpdateFormatQuality(e, t, o, r, i) {
    var s = this;
    s.configs[e][t][o][r] = i;

    await Editor.Profile.setProject(
      "builder",
      "textureCompressConfig.userPreset." + e,
      s.configs[e]
    );

    s.throttledBroadcastUpdated();
  },
  async _onAfterChange(e, t) {
    var o = this;
    o.$set(o.configs, e, t);

    await Editor.Profile.setProject(
      "builder",
      "textureCompressConfig.userPreset." + e,
      t
    );

    o.throttledBroadcastUpdated();
  },
  async onAddOverwritePlatform(e, t, o) {
    var r = JSON.parse(JSON.stringify(this.configs[e]));
    lodash_1.default.set(r, "overwrite." + t, r.options[o] || {});
    this._onAfterChange(e, r);
  },
  async onAddFormat(e, t, o, r) {
    var i = this;
    const s = JSON.parse(JSON.stringify(i.configs[e]));

    if (!s[t][o]) {
      s[t][o] = {};
    }

    var n = {
      ...i.compressConfig.formatsInfo,
      ...i.compressConfig.customFormats,
    };
    const a = i.compressConfig.textureFormatConfigs[n[r].formatType].options;
    s[t][o][r] = {};

    Object.keys(a).forEach((e) => {
      s[t][o][r][e] = a[e].default;
    });

    i._onAfterChange(e, s);
  },
  onConfigNameChange(e) {
    this.newConfigName = e.target.value;
  },
  async onRemoveFormat(e, t, o, r) {
    var i;
    var s = this;
    if (!o && !r) {
      return (
        await Editor.Dialog.info(
          Editor.I18n.t(
            "builder.project.texture_compress.tips.checkRemoveConfig"
          ),
          {
            default: 0,
            cancel: 1,
            buttons: [
              Editor.I18n.t("builder.confirm"),
              Editor.I18n.t("builder.cancel"),
            ],
          }
        )
      ).response === 1
        ? undefined
        : (delete s.configs[e], void s._onAfterChange(e, null));
    }

    if (o && !r) {
      delete (i = JSON.parse(JSON.stringify(s.configs[e])))[t][o];
      s._onAfterChange(e, i);
    } else if (o) {
      i = JSON.parse(JSON.stringify(s.configs[e]));
      r ? delete i[t][o][r] : delete i[t][o];
      s._onAfterChange(e, i);
    }
  },
  async onChangeFormatName(e, t) {
    this.configs[e].name = t;

    await Editor.Profile.setProject(
      "builder",
      "textureCompressConfig.userPreset",
      this.configs
    );

    this.throttledBroadcastUpdated();
  },
  async importConfig() {
    var t = this;

    var o = (
      await Editor.Dialog.select({
        title: t.t("import_config"),
        path: Editor.Project.path,
        filters: [{ name: "JSON", extensions: ["json"] }],
      })
    ).filePaths[0];

    if (o) {
      var r = await Editor.Dialog.warn(t.t("import_config_options"), {
        buttons: [t.t("overwrite"), t.t("merge")],
        default: 1,
      });
      let e;
      try {
        e = readJSONSync(o);

        if (!checkCompressOptions(e)) {
          return void console.error(
            Editor.I18n.t(
              "builder.project.texture_compress.tips.import_failed",
              { link: Editor.Utils.Url.getDocUrl("editor/project") }
            )
          );
        }

        if (r.response === 1) {
          for (const i of Object.keys(e)) {
            t.$set(t.configs, i, e[i]);
          }
        } else {
          t.configs = e;
        }
      } catch (e) {
        return void console.error(e);
      }

      await Editor.Profile.setProject(
        "builder",
        "textureCompressConfig.userPreset",
        e
      );

      console.log(`Import texture compress config from {link(${o})} success!`);

      t.throttledBroadcastUpdated();
    }
  },
  async exportConfig() {
    var e = await Editor.Dialog.save({
      title: this.t("export_config"),
      path: join(Editor.Project.path, "texture-compress-config.json"),
      filters: [{ name: "JSON", extensions: ["json"] }],
    });

    if (e.filePath) {
      await outputFile(e.filePath, JSON.stringify(this.configs, null, 2));

      console.log(
        `Texture compress config has export in {link(${e.filePath})}.`
      );
    }
  },
  broadcastUpdated() {
    Editor.Message.broadcast("builder:texture-compress-config-updated");
  },
};
