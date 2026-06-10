var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (t, o, e, r = e) => {
        var i = Object.getOwnPropertyDescriptor(o, e);

        if (
          !i ||
          (!("get" in i) ? !i.writable && !i.configurable : o.__esModule)
        ) {
          i = {
            enumerable: true,
            get() {
              return o[e];
            },
          };
        }

        Object.defineProperty(t, r, i);
      }
    : (t, o, e, r) => {
        t[(r = r === undefined ? e : r)] = o[e];
      });

var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? (t, o) => {
        Object.defineProperty(t, "default", { enumerable: true, value: o });
      }
    : (t, o) => {
        t.default = o;
      });

var __importStar =
  (this && this.__importStar) ||
  (() => {
    var i = (t) =>
      (i =
        Object.getOwnPropertyNames ||
        ((t) => {
          var o;
          var e = [];
          for (o in t) {
            if (Object.prototype.hasOwnProperty.call(t, o)) {
              e[e.length] = o;
            }
          }
          return e;
        }))(t);
    return (t) => {
      if (t && t.__esModule) {
        return t;
      }
      var o = {};
      if (t != null) {
        for (var e = i(t), r = 0; r < e.length; r++) {
          if (e[r] !== "default") {
            __createBinding(o, t, e[r]);
          }
        }
      }
      __setModuleDefault(o, t);
      return o;
    };
  })();

Object.defineProperty(exports, "__esModule", { value: true });

exports.methods = undefined;
exports.computed = undefined;
exports.data = undefined;
exports.props = undefined;
exports.template = undefined;
exports.components = undefined;

exports.mounted = mounted;

const { readFileSync, readJSON, outputFile } = require("fs-extra");

const { join } = require("path");

const customConfig = __importStar(require("../comp/custom-config"));
const configToolbar = __importStar(require("../comp/config-toolbar"));
function getDefaultConfig(t) {
  return {
    id: Editor.Utils.UUID.generate(),
    name: t,
    path: "",
    command: "",
    format: "png",
  };
}

exports.components = {
  "custom-config": customConfig,
  "config-toolbar": configToolbar,
};

exports.template = readFileSync(
  join(__dirname, "../../../../static/contributions/compress-format.html"),
  "utf8"
);

exports.props = ["compressConfig", "customConfigs", "overwriteFormats"];
const data = () => ({
  editConfig: null,
  searchName: "",
});
async function mounted() {}
exports.data = data;

exports.computed = {
  displayConfigs() {
    const o = this;
    const e = {};
    return o.customConfigs
      ? (Object.keys(o.customConfigs).forEach((t) => {
          if (o.customConfigs[t].name.includes(o.searchName)) {
            e[t] = o.customConfigs[t];
          }
        }),
        e)
      : {};
  },
};

exports.methods = {
  t(t) {
    return Editor.I18n.t("builder.project.texture_compress." + t);
  },
  async init() {
    const o = this;

    o.customConfigs =
      (await Editor.Profile.getProject(
        "builder",
        "textureCompressConfig.customConfigs"
      )) || {};

    if (o.customConfigs && Object.keys(o.customConfigs)) {
      Object.values(o.customConfigs).forEach((t) => {
        if (t.overwrite) {
          o.overwriteFormats[t.format] &&
            ((o.customConfigs[o.overwriteFormats[t.format]].overwrite = false),
            console.debug(
              `conflic format config ${t.format}(${
                o.overwriteFormats[t.format]
              } is invalid.)`
            ));

          o.overwriteFormats[t.format] = t.id;
        }
      });
    }

    o.mode =
      (await Editor.Profile.getProject(
        "builder",
        "textureCompressConfig.customConfigsMode"
      )) || "config";
  },
  async onToolBarChange(t, o) {
    var e = this;
    switch (t) {
      case "add-config": {
        e.addConfig(o);
        break;
      }
      case "import-config": {
        e.importConfig();
        break;
      }
      case "export-config": {
        e.exportConfig();
        break;
      }
      case "search-name": {
        e.searchName = o;
      }
    }
  },
  async addConfig(t) {
    const o = this;
    let e;

    if (t) {
      e = JSON.parse(JSON.stringify(o.customConfigs[t]));
      e.name = "(copy)";
      e.id = Editor.Utils.UUID.generate();
    } else {
      e = getDefaultConfig("New Format Config");
    }

    t = o.customConfigs || {};
    o.$set(t, e.id, e);
    o.$root.customConfigs = t;

    await Editor.Profile.setProject(
      "builder",
      "textureCompressConfig.customConfigs." + e.id,
      e
    );

    o.emitChange();

    process.nextTick(() => {
      o.jumpToConfig(e.id);
    });
  },
  jumpToConfig(t) {
    if (this.$refs.wrap) {
      const o = this.$refs.wrap.querySelector(`div[id="${t}"]`);

      if (o) {
        o.scrollIntoView();
        o.setAttribute("twinkle", "shake");

        setTimeout(() => {
          o.setAttribute("twinkle", "");
        }, 900);
      }
    }
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
      var e;

      var r = await Editor.Dialog.warn(t.t("import_config_options"), {
        buttons: [t.t("overwrite"), t.t("merge")],
        default: 1,
      });

      try {
        e = await readJSON(o);
        for (const i of Object.keys(e)) {
          if (!e[i] || !e[i].format) {
            return void Editor.Dialog.error("Invalid compress config!");
          }
        }
        if (r.response === 1) {
          for (const s of Object.keys(e)) {
            t.$set(t.customConfigs, s, e[s]);
          }
        } else {
          t.$root.customConfigs = e;
        }
        t.$root.calcOverwriteFormats();
        t.emitChange();

        await Editor.Profile.setProject(
          "builder",
          "textureCompressConfig.customConfigs",
          t.$root.customConfigs
        );

        console.log(`Import custom compress config from {link(${o})} success!`);
      } catch (t) {
        console.error(t);
      }
    }
  },
  async exportConfig() {
    var t = await Editor.Dialog.save({
      title: this.t("export_config"),
      path: join(Editor.Project.path, "custom-compress-config.json"),
      filters: [{ name: "JSON", extensions: ["json"] }],
    });

    if (t.filePath) {
      await outputFile(t.filePath, JSON.stringify(this.customConfigs, null, 2));

      console.log(
        `Custom compress config has export in {link(${t.filePath})}.`
      );
    }
  },
  async onConfigChange(t, o, e) {
    var r = this;
    var o = Object.assign({}, r.customConfigs[t], { [o]: e });
    r.$set(r.customConfigs, t, o);

    await Editor.Profile.setProject(
      "builder",
      "textureCompressConfig.customConfigs." + t,
      r.customConfigs[t]
    );

    r.emitChange();
  },
  async onRemoveFormat(t) {
    var o = this;
    o.$set(o.customConfigs, t, null);
    delete o.customConfigs[t];

    await Editor.Profile.setProject(
      "builder",
      "textureCompressConfig.customConfigs",
      o.customConfigs
    );

    o.emitChange();
  },
  async emitChange() {
    this.$emit("update");
    Editor.Message.broadcast("builder:texture-compress-config-updated");
  },
};
