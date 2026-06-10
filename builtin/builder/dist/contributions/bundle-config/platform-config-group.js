var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (t, e, o, l = o) => {
        var i = Object.getOwnPropertyDescriptor(e, o);

        if (
          !i ||
          (!("get" in i) ? !i.writable && !i.configurable : e.__esModule)
        ) {
          i = {
            enumerable: true,
            get() {
              return e[o];
            },
          };
        }

        Object.defineProperty(t, l, i);
      }
    : (t, e, o, l) => {
        t[(l = l === undefined ? o : l)] = e[o];
      });

var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? (t, e) => {
        Object.defineProperty(t, "default", { enumerable: true, value: e });
      }
    : (t, e) => {
        t.default = e;
      });

var __importStar =
  (this && this.__importStar) ||
  (() => {
    var i = (t) =>
      (i =
        Object.getOwnPropertyNames ||
        ((t) => {
          var e;
          var o = [];
          for (e in t) {
            if (Object.prototype.hasOwnProperty.call(t, e)) {
              o[o.length] = e;
            }
          }
          return o;
        }))(t);
    return (t) => {
      if (t && t.__esModule) {
        return t;
      }
      var e = {};
      if (t != null) {
        for (var o = i(t), l = 0; l < o.length; l++) {
          if (o[l] !== "default") {
            __createBinding(e, t, o[l]);
          }
        }
      }
      __setModuleDefault(e, t);
      return e;
    };
  })();

Object.defineProperty(exports, "__esModule", { value: true });

exports.methods = undefined;
exports.data = undefined;
exports.computed = undefined;
exports.components = undefined;
exports.props = undefined;
exports.template = undefined;

const ConfigItem = __importStar(require("./bundle-config-item"));
const bundle_utils_1 = require("../../share/bundle-utils");

exports.template = `
<div class="container">
  <ui-prop class="label tip">
      <ui-label slot="label" value="i18n:builder.asset_bundle.platform"></ui-label>
      <div slot="content" class="platform-container">
          <ui-label
              value="i18n:builder.asset_bundle.compression_type"
              tooltip="i18n:builder.asset_bundle.compression_type_tooltip"
          ></ui-label>
          <div>
              <ui-label
                  value="i18n:builder.asset_bundle.is_remote_bundle"
                  tooltip="i18n:builder.asset_bundle.remote_bundle_invalid_tooltip"
              ></ui-label>
          </div>
      </div>
  </ui-prop>
  <template v-if="platformConfigs">
      <ui-prop class="platform-config"
          v-for="(config, platform) in platformConfigs"
          v-if="platformSettings && platformSettings[platform] || showAll"
          :key="JSON.stringify(config)"
          :selectable="canSelect"
          :active="canSelect && selectPlatform.includes(platform)"
          @click.stop="onSelect($event, platform)"
      >
          <ui-label slot="label"
              :value="config.platformName"
          ></ui-label>
          <div slot="content" v-if="config.supportOptions">
              <config-item class="platform-container"
                  :type="platform"
                  :option="platformSettings && platformSettings[platform] || {}"
                  :readonly="readonly"
                  :support-options="config.supportOptions"
                  @update="onPlatformSettingsChange"
              >
              </config-item>
          </div>
      </ui-prop>
  </template>
</div>
`;

exports.props = [
  "platformSettings",
  "readonly",
  "platformConfigs",
  "showAll",
  "selectPlatform",
];

exports.components = { "config-item": ConfigItem };

exports.computed = {
  canSelect() {
    return !this.readonly && this.selectPlatform;
  },
};

const data = () => ({
  compressRenderList: Object.freeze(bundle_utils_1.BundlecompressionTypeMap),
});

exports.data = data;

exports.methods = {
  onPlatformSettingsChange(t, e, o) {
    var l = (this.platformSettings && this.platformSettings[o]) || {};

    if (this.platformSettings) {
      this.$set(this.platformSettings, o, l);
      this.$set(this.platformSettings[o], t, e);
    } else {
      l[t] = e;
    }

    this.$emit("update", o, l);
  },
  onSelect(t, e) {
    var o = this;

    if (!o.readonly && o.canSelect) {
      if (t.shiftKey) {
        if (o.selectPlatform.includes(e)) {
          o.selectPlatform.splice(o.selectPlatform.indexOf(e), 1);
        } else {
          o.selectPlatform.push(e);
        }
      } else {
        o.selectPlatform.length = 0;
        o.selectPlatform.push(e);
      }
    }
  },
};
