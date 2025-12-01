(() => {
  "use strict";
  const e = require("fire-path");
  const t = Editor.require("packages://inspector/utils/utils");
  const i = require(Editor.url("app://editor/share/build-utils"));
  const r = Editor.Profile.load("global://features.json");
  const o = [];

  if (!r.get("huawei-agc")) {
    o.push("huawei-agc");
  }

  if (!r.get("link-sure")) {
    o.push("link-sure");
  }

  if (!r.get("bytedance-minigame")) {
    o.push("bytedance");
    o.push("bytedance-subcontext");
  }

  Editor.Panel.extend({
    dependencies: [
      "packages://inspector/share/meta-header.js",
      "packages://inspector/share/markdown-preview.js",
    ],
    style:
      "\n      span {\n        color: #ccc;\n        white-space: nowrap;\n        text-overflow: ellipsis;\n        overflow-x: hidden;\n        margin-right: 5px;\n      }\n    ",
    template: `\n      <cc-meta-header\n        :target="target"\n        icon="unpack://static/icon/assets/folder.png"\n      ></cc-meta-header>\n\n      <div class="props flex-1">\n        <div class="layout horizontal center">\n          <span class="flex-1">{{ target.__url__ }}</span>\n          <ui-button class="blue tiny" @confirm="explore">\n            <i class="fa fa-folder-open"></i>\n          </ui-button>\n        </div>\n        <ui-prop \n          name="{{_t('is_bundle')}}" \n          type="boolean" v-if="!isResources" \n          v-value="target.isBundle" \n          v-values="target.multiValues.isBundle" \n          :multi-values="multi" \n        ></ui-prop>\n        <ui-prop \n          v-if="_isBundle()" \n          v-readonly="isResources"\n          name="{{_t('bundle_name')}}" \n        >\n          <ui-input\n              :placeholder="_bundleName(target.__url__)"\n              v-value="target.bundleName"\n              v-values="target.multiValues.bundleName"\n              :multi-values="multi"\n          ></ui-input>\n        </ui-prop>\n        \n        <ui-prop \n        name="{{_t('priority')}}" \n        toolTip="{{_t('priority_tooltip')}}" \n        v-readonly="isResources" \n        type="enum"\n        v-if="_isBundle()" \n        v-value="curPriority" \n        @confirm="_priorityChanged">\n          <option value="1">1</option>\n          <option value="2">2</option>\n          <option value="3">3</option>\n          <option value="4">4</option>\n          <option value="5">5</option>\n          <option value="6">6</option>\n          <option value="7">7</option>\n          <option value="8">8</option>\n          <option value="9">9</option>\n          <option value="10">10</option>\n          <option value="11" v-if="_isInternal()">11</option>\n        </ui-prop>\n        <ui-prop name="{{_t('target_platform')}}" toolTip="{{_t('target_platform_tooltip')}}"type="enum" v-if="_isBundle()" v-value="curPlatform" @change.stop @confirm.stop="_platformChanged">\n          <option v-for="platform of platforms" v-value="platform">{{_getPlatformName(platform)}}</option>\n        </ui-prop>\n        <ui-prop name="{{_t('compression_type')}}" toolTip="{{_t('compression_type_tooltip')}}" type="enum" v-if="_isBundle()" v-value="curCompressionType" @confirm="_settingsChanged">\n          <option value="none" title="{{_t('none_tooltip')}}">{{_t('none')}}</option>\n          <option value="default" title="{{_t('default_tooltip')}}">{{_t('default')}}</option>\n          <option value="merge_all_json" title="{{_t('merge_all_json_tooltip')}}">{{_t('merge_all_json')}}</option>\n          <option value="subpackage" v-if="_supportSubpackage()" title="{{_t('subpackage_tooltip')}}">{{_t('subpackage')}}</option>\n          <option value="zip" v-if="_supportZip()" title="{{_t('zip_tooltip')}}">{{_t('zip')}}</option>\n        </ui-prop>\n        <ui-prop \n          name="${Editor.T(
      "BUILDER.merge_asset.optimize_hot_update"
    )}" \n          tooltip="${Editor.T(
      "BUILDER.merge_asset.optimize_hot_update_tooltip"
    )}" \n          type="boolean" v-if="_isBundle()&&curCompressionType==='default'&&_isNative()" \n          v-value="curOptimizeHotUpdate"\n          @confirm="_settingsChanged" \n        ></ui-prop>\n        <ui-prop \n          name="${Editor.T(
      "BUILDER.merge_asset.inline_SpriteFrames"
    )}" \n          tooltip="${Editor.T(
      "BUILDER.merge_asset.inline_SpriteFrames_tooltip"
    )}" \n          type="boolean" \n          v-if="_isBundle()&&curCompressionType==='default'" \n          v-readonly="curOptimizeHotUpdate"\n          v-value="curInlineSpriteFrames"\n          @confirm="_settingsChanged"\n        ></ui-prop>\n        <ui-prop \n          name="{{_t('is_remote_bundle')}}" \n          title="{{_t('is_remote_bundle_tooltip')}}"\n          type="boolean" \n          v-readonly="_isRemoteBundleReadonly()"\n          v-if="_supportRemoteBundle()"\n          v-value="curIsRemoteBundle"\n          @confirm="_settingsChanged" \n        ></ui-prop>\n        <cc-markdown-preview v-if="_isBundle()"\n          :path="_getMarkdownUrl(isResources)">\n        </cc-markdown-preview>\n      </div>\n    `,
    ready() {
      this._targetChanged();
    },
    data: {
      curPriority: 1,
      url: "",
      isResources: false,
      curCompressionType: "default",
      curPlatform: "web-mobile",
      curOptimizeHotUpdate: false,
      curInlineSpriteFrames: false,
      curIsRemoteBundle: false,
      platforms: [
        "web-mobile",
        "web-desktop",
        "fb-instant-games",
        "android",
        "android-instant",
        "ios",
        "mac",
        "win32",
      ]
        .concat(Object.keys(Editor.remote.Builder.simpleBuildTargets))
        .filter((e) => !o.includes(e)),
    },
    watch: { target: "_targetChanged" },
    methods: {
      _t: (e) => Editor.T(`INSPECTOR.folder.${e}`),
      _supportRemoteBundle() {
        return this._isBundle() && i.supportRemote(this.curPlatform);
      },
      _isRemoteBundleReadonly() {
        return (
          (this._isNative() && this.isResources) ||
          "zip" === this.curCompressionType ||
          "subpackage" === this.curCompressionType
        );
      },
      _updateCurRemoteBundle() {
        if (this._supportRemoteBundle()) {
          if (this._isRemoteBundleReadonly()) {
            if ((this._isNative() && this.isResources) ||
                "subpackage" === this.curCompressionType) {
              this.curIsRemoteBundle = false;
            } else {
              if ("zip" === this.curCompressionType) {
                this.curIsRemoteBundle = true;
              }
            }
          }
        } else {
          this.curIsRemoteBundle = false;
        }
      },
      _isBundle() {
        return this.target.isBundle || this.isResources;
      },
      _isNative() {
        return i.isNativePlatform(this.curPlatform);
      },
      _isInternal() {
        return "db://internal/resources" === this.target.__url__;
      },
      _supportSubpackage() {
        return i.supportSubpackage(this.curPlatform);
      },
      _supportZip() {
        return i.supportZip(this.curPlatform);
      },
      _priorityChanged() {
        this.target.metas.forEach((e) => {
          e.priority = this.curPriority;
        });
      },
      _platformChanged() {
        this.curCompressionType = this.target.compressionType[this.curPlatform] ||
        (this._isInternal() ? "merge_all_json" : "default");

        this.curInlineSpriteFrames = this.target.inlineSpriteFrames[this.curPlatform] || false;
        this.curOptimizeHotUpdate = this.target.optimizeHotUpdate[this.curPlatform] || false;
        this.curIsRemoteBundle = this.target.isRemoteBundle[this.curPlatform] || false;
      },
      _settingsChanged() {
        this._updateCurRemoteBundle();

        if (this.curOptimizeHotUpdate) {
          this.curInlineSpriteFrames = false;
        }

        this.target.metas.forEach((e) => {
          e.compressionType[this.curPlatform] = this.curCompressionType;
          e.optimizeHotUpdate[this.curPlatform] = this.curOptimizeHotUpdate;
          e.inlineSpriteFrames[this.curPlatform] = this.curInlineSpriteFrames;
          e.isRemoteBundle[this.curPlatform] = this.curIsRemoteBundle;
        });
      },
      _getPlatformName(e) {
        let t = Editor.remote.Builder.simpleBuildTargets;
        return e in t ? t[e].name : Editor.T("BUILDER.platforms." + e) || e;
      },
      async _onApply() {
        if (this.isResources) {
          return true;
        }
        let e = await t.checkDuplicateNameForBuiltinBundle(this.target);

        if (!e) {
          Editor.Ipc.sendToWins("inspector:bundle-updated");
        }

        return !e;
      },
      _bundleName: (t) =>
        "db://assets/resources" === t
          ? "resources"
          : "db://internal/resources" === t
          ? "internal"
          : e.basenameNoExt(t),
      _getMarkdownUrl: (e) =>
        e
          ? Editor.url(Editor.T("MESSAGE.assets.resources_url"))
          : Editor.url(Editor.T("MESSAGE.assets.bundle_url")),
      _targetChanged() {
        if (this.target) {
          this.url = this.target.__url__;

          this.isResources = "db://assets/resources" === this.url ||
          "db://internal/resources" === this.url;

          this._platformChanged();
          this.curPriority = this.target.priority;

          if ("db://assets/resources" === this.url) {
            this.curPriority = 8;
          }
        } else {
          this.url = "";
          this.isResources = false;
        }
      },
      explore() {
        Editor.assetdb.explore(this.url);
      },
    },
  });
})();
