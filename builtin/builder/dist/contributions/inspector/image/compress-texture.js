var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, s, r = s) => {
        var o = Object.getOwnPropertyDescriptor(t, s);

        if (
          !o ||
          (!("get" in o) ? !o.writable && !o.configurable : t.__esModule)
        ) {
          o = {
            enumerable: true,
            get() {
              return t[s];
            },
          };
        }

        Object.defineProperty(e, r, o);
      }
    : (e, t, s, r) => {
        e[(r = r === undefined ? s : r)] = t[s];
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
    var o = (e) =>
      (o =
        Object.getOwnPropertyNames ||
        ((e) => {
          var t;
          var s = [];
          for (t in e) {
            if (Object.prototype.hasOwnProperty.call(e, t)) {
              s[s.length] = t;
            }
          }
          return s;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var t = {};
      if (e != null) {
        for (var s = o(e), r = 0; r < s.length; r++) {
          if (s[r] !== "default") {
            __createBinding(t, e, s[r]);
          }
        }
      }
      __setModuleDefault(t, e);
      return t;
    };
  })();

Object.defineProperty(exports, "__esModule", { value: true });

exports.components = undefined;
exports.methods = undefined;
exports.computed = undefined;
exports.props = undefined;
exports.template = undefined;

exports.data = data;
exports.created = created;
exports.mounted = mounted;
exports.beforeDestroy = beforeDestroy;

const { throttle } = require("lodash");

const electron_1 = require("electron");

const ConfigGroup = __importStar(
  require("../../texture-compress/comp/config-group")
);

const {
  checkHasMipMaps,
  isPowerOfTwo,
} = require("../../../worker/builder/asset-handler/texture-compress/minimaps");

const CONFIG_UPDATED_EVENT = "builder:texture-compress-config-updated";
function data() {
  return {
    textureCompressConfig: null,
    customConfigs: null,
    overwriteFormats: {},
    latestConfigUpdate: null,
    genMipMaps: false,
    imageSize: null,
  };
}
function created() {
  this.throttledOnConfigUpdated = throttle(
    this.onConfigUpdated.bind(this),
    250,
    { trailing: true }
  );
}
async function mounted() {
  Editor.Message.__protected__.addBroadcastListener(
    CONFIG_UPDATED_EVENT,
    this.throttledOnConfigUpdated
  );

  await this.refresh();
}
function beforeDestroy() {
  Editor.Message.__protected__.removeBroadcastListener(
    CONFIG_UPDATED_EVENT,
    this.throttledOnConfigUpdated
  );
}

exports.template = `
<div>
    <ui-prop
        v-if="meta && meta.userData"
        :readonly="readonly"
        :disabled="readonly"
    >
        <ui-label slot="label" value="i18n:builder.assets.auto_atlas.useCompressTexture" tooltip="Use Compress Texture"></ui-label>
        <ui-checkbox slot="content"
            :value="useCompressTexture"
            :disabled="readonly"
            :invalid="invalidUseCompressTexture"
            @confirm="_onCompressSettingsChanged($event, 'useCompressTexture')"
        ></ui-checkbox>
    </ui-prop>
    <ui-label v-if="disabledMipMapTips" class="warn" :value="disabledMipMapTips"></ui-label>

    <ui-prop
        v-if="useCompressTexture && !invalidUseCompressTexture"
        :readonly="readonly"
    >
        <ui-label slot="label" tooltip="Preset Id">Preset Id</ui-label>
        <div slot="content">
            <ui-select-pro
                :disabled="readonly"
                :invalid="invalidPresetId"
                @confirm="_onCompressSettingsChanged($event, 'presetId')"
            >
                <template v-if="config" v-for="(config, id) in textureCompressConfig.userPreset">
                    <ui-select-option-pro
                        :value="id"
                        :key="id"
                        :label="config.name"
                        :selected="id === currentCompressPresetId"
                    />
                </template>
                <template v-for="(config, id) in textureCompressConfig.defaultConfig">
                    <ui-select-option-pro
                        v-if="config"
                        :value="id"
                        :key="id"
                        :label="config.name"
                        :selected="id === currentCompressPresetId"
                    />
                </template>
            </ui-select-pro>
            <ui-button value="edit"
                @confirm.stop="jumpToProjectSettings(meta.userData.compressSettings && meta.userData.compressSettings.presetId || 'default')"
                tooltip="i18n:builder.project.texture_compress.tips.jump_to_edit_config"
            ><ui-label value="i18n:builder.assets.image.edit_preset"></ui-label></ui-button>
        </div>
    </ui-prop>

    <config-group readonly="true"
        class="platform-setting"
        v-if="userTextureCompress && !invalidUseCompressTexture && !invalidPresetId"
        :compress-config="textureCompressConfig"
        :overwrite-formats="overwriteFormats"
        :config="userTextureCompress.config"
    >
    </config-group>
</div>`;

exports.props = ["meta", "metas", "readonly"];

exports.computed = {
  currentCompressPresetId() {
    return (
      (this.meta.userData.compressSettings &&
        this.meta.userData.compressSettings.presetId) ||
      "default"
    );
  },
  userTextureCompress() {
    var e = this;
    var t = e.meta || e.metas[0];
    return e.textureCompressConfig &&
      e.textureCompressConfig.userPreset &&
      t.userData.compressSettings &&
      t.userData.compressSettings.useCompressTexture &&
      ((t = t.userData.compressSettings.presetId || "default"),
      (e =
        e.textureCompressConfig.userPreset[t] ||
        e.textureCompressConfig.defaultConfig[t]))
      ? { name: t, config: e }
      : null;
  },
  invalidUseCompressTexture() {
    const s = this;
    const r = !!s.meta.userData.compressSettings;
    return s.metas.some((e) => {
      var t = !!e.userData.compressSettings;
      return (
        r != t ||
        (r &&
          e.userData.compressSettings.useCompressTexture !==
            s.meta.userData.compressSettings.useCompressTexture)
      );
    });
  },
  invalidPresetId() {
    const s = this;
    const r = !!s.meta.userData.compressSettings;
    return s.metas.some((e) => {
      var t = !!e.userData.compressSettings;
      return (
        r != t ||
        (r &&
          e.userData.compressSettings.presetId !==
            s.meta.userData.compressSettings.presetId)
      );
    });
  },
  useCompressTexture() {
    var { textureCompressConfig, meta } = this;
    return (
      textureCompressConfig &&
      meta.userData &&
      meta.userData.compressSettings &&
      meta.userData.compressSettings.useCompressTexture
    );
  },
  disabledMipMapTips() {
    var e = this;
    var t = e.meta || e.metas[0];
    return e.genMipMaps && e.useCompressTexture && checkHasMipMaps(t)
      ? t.importer !== "auto-atlas" || t.userData.powerOfTwo
        ? !(t = e.imageSize) ||
          (isPowerOfTwo(t.width) && isPowerOfTwo(t.height))
          ? ""
          : "i18n:builder.project.texture_compress.mipmap.noPowerOfTwo"
        : "i18n:builder.project.texture_compress.mipmap.noPowerOfTwoWithAtlas"
      : "";
  },
};

exports.methods = {
  jumpToProjectSettings(e) {
    Editor.Message.send(
      "project",
      "open-settings",
      "builder",
      "compress-texture",
      e
    );
  },
  _onCompressSettingsChanged(s, r) {
    const o = this;

    o.metas.forEach((e) => {
      var t =
        (e.userData.compressSettings &&
          JSON.parse(JSON.stringify(e.userData.compressSettings))) ||
        {};
      t[r] = s.target.value;
      o.$set(e.userData, "compressSettings", t);
    });

    o.$emit("confirm");
  },
  async refreshCompressConfig() {
    const t = this;
    var e;
    var s;
    var r = Date.now();
    this.latestConfigUpdate = r;

    if (this.latestConfigUpdate === r) {
      ({ userPreset: r, defaultConfig: e } = await Editor.Profile.getProject(
        "builder",
        "textureCompressConfig"
      ));

      t.customConfigs =
        (await Editor.Profile.getProject(
          "builder",
          "textureCompressConfig.customConfigs"
        )) || {};

      t.customConfigs &&
        Object.keys(t.customConfigs) &&
        Object.values(t.customConfigs).forEach((e) => {
          if (e.overwrite) {
            t.overwriteFormats[e.format] &&
              ((t.customConfigs[
                t.overwriteFormats[e.format]
              ].overwrite = false),
              console.debug(
                `conflict format config ${e.format}(${
                  t.overwriteFormats[e.format]
                } is invalid.)`
              ));

            t.$set(t.overwriteFormats, e.format, e.id);
          }
        });

      s = await Editor.Message.request("builder", "query-compress-config");

      Object.assign(s, { userPreset: r, defaultConfig: e });
      t.$set(t, "textureCompressConfig", s);
    }
  },
  async getImageSize(e) {
    var t = this;
    if (!e || !t.useCompressTexture) {
      return null;
    }
    if (!t.imageSize) {
      e = await Editor.Message.request("asset-db", "query-asset-info", e);
      if (!e) {
        return;
      }
      e = electron_1.nativeImage.createFromPath(e.file);
      t.imageSize = e.getSize();
    }
    return t.imageSize;
  },
  async refresh() {
    var e = this;
    await e.refreshCompressConfig();

    e.genMipMaps = await Editor.Profile.getProject(
      "builder",
      "textureCompressConfig.genMipmaps"
    );

    e.imageSize = await e.getImageSize(e.meta.uuid);
  },
  onConfigUpdated() {
    this.refreshCompressConfig();
  },
};

exports.components = { "config-group": ConfigGroup };
