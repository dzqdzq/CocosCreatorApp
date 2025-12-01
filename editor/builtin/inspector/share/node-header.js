"use strict";
const e = Editor.require("scene://edit-mode");
Vue.component("cc-node-header", {
  template:
    '\n    <div :style="cssHost">\n      <div :style="cssPrefab" class="layout horizontal center-center" v-if="target.__prefab__">\n        <ui-button\n          title="{{T(\'INSPECTOR.node.prefab_sync_mode\')}}"\n          class="tiny transparent green"\n          v-if="target.__prefab__.sync"\n          @confirm="prefabSetSync"\n        >\n          <i class="fa fa-link"></i>\n        </ui-button>\n        <ui-button\n          title="{{T(\'INSPECTOR.node.prefab_unsync_mode\')}}"\n          class="tiny transparent blue"\n          v-if="enabledPrefabSetSync()"\n          @confirm="prefabSetSync"\n        >\n          <i class="fa fa-unlink"></i>\n        </ui-button>\n        \n        <div :style="cssLabel">Prefab: </div>\n        <ui-button\n          class="tiny transparent"\n          :style="cssPrefabNameBtn"\n          @confirm="prefabSelectRoot"\n        >\n          <span :style="cssPrefabName">{{target.__prefab__.rootName}}</span>\n        </ui-button>\n        \n        <span class="flex-1"></span>\n\n        <ui-button\n          title="{{T(\'INSPECTOR.node.prefab_select\')}}"\n          class="tiny transparent"\n          @confirm="prefabSelectAsset"\n        >\n          {{T(\'INSPECTOR.node.prefab_btn_select\')}}\n        </ui-button>\n        <ui-button\n          v-if="!target.__prefab__.subNode && !target.__prefab__.subPrefab"\n          v-el:revert\n          title="{{T(\'INSPECTOR.node.prefab_revert\')}}"\n          class="tiny transparent"\n          @confirm="prefabRevert"\n        >\n          {{T(\'INSPECTOR.node.prefab_btn_revert\')}}\n        </ui-button>\n        <ui-button\n          v-if="!target.__prefab__.assetReadonly && !target.__prefab__.subNode && !target.__prefab__.subPrefab"\n          v-el:save\n          title="{{T(\'INSPECTOR.node.prefab_apply\')}}"\n          class="tiny transparent"\n          @confirm="prefabApply"\n        >\n          {{T(\'INSPECTOR.node.prefab_btn_apply\')}}\n        </ui-button>\n      </div>\n      <div class="layout horizontal center-center">\n        <ui-checkbox\n          v-value="target.active.value"\n          v-values="target.active.values"\n          :multi-values="_updateActiveMulti(target.active)"\n          tooltip="{{T(\'INSPECTOR.node.active\')}}"\n        ></ui-checkbox>\n        <ui-input class="flex-1"\n          v-value="target.name.value"\n          v-values="target.name.values"\n          :multi-values="_updateNameMulti(target.name)"\n          tooltip="{{T(\'INSPECTOR.node.name\')}}"\n        >\n        </ui-input>\n        <ui-button class="tiny transparent"\n          @click="toggle3D"\n          :pressed="target.is3DNode.value"\n          :style="target.is3DNode.value ? css3dBtnPressed : css3dBtn"\n          title="{{\'TODO\'}}"\n          >\n          3D\n        </ui-button>\n      </div>\n    </div>\n  ',
  data: () => ({
    cssHost: {
      flex: "none",
      paddingBottom: "2px",
      margin: "5px 10px",
      marginBottom: "3px",
      overflow: "hidden",
    },
    cssPrefab: {
      borderBottom: "1px solid #666",
      marginBottom: "5px",
      paddingBottom: "1px",
    },
    cssLabel: { fontWeight: "bold", whiteSpace: "pre" },
    cssPrefabNameBtn: { flexShrink: 1, marginRight: "10px" },
    cssPrefabName: {
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
    css3dBtn: {
      "font-weight": "normal",
      "font-size": ".8rem",
      color: "rgb(170, 170, 170)",
      width: "29px",
    },
    css3dBtnPressed: {
      "font-weight": "normal",
      "font-size": ".8rem",
      color: "rgb(49, 157, 255)",
      background: "#454545",
      width: "29px",
      "box-shadow": "inset 0 2px 10px rgba(0, 0, 0, 0.5)",
      "transition-duration": "0.20s",
    },
  }),
  props: { target: { twoWay: true, type: Object }, multi: { type: Boolean } },
  methods: {
    T: Editor.T,
    enabledPrefabSetSync() {
      let t = this.target.__prefab__;
      return "prefab" === e.curMode().name
        ? !t.sync && t.handPrefabUuid
        : !t.sync;
    },
    toggle3D(e) {
      e.stopPropagation();

      this.target.uuid.split("^").forEach((e) => {
        Editor.Ipc.sendToPanel("scene", "scene:set-property", {
          id: e,
          path: "is3DNode",
          value: !this.target.is3DNode.value,
          isSubProp: false,
        });
      });
    },
    prefabSelectAsset() {
      Editor.UI.fire(this.$el, "prefab-select-asset", { bubbles: true });
    },
    prefabSelectRoot() {
      Editor.UI.fire(this.$el, "prefab-select-root", { bubbles: true });
    },
    prefabApply() {
      if (this.target.__prefab__.hasSubPrefab) {
        if (this._applyRequestID) {
          Editor.Ipc.cancelRequest(this._applyRequestID);
          this._applyRequestID = null;
        }

        let e = this.$els.save.getBoundingClientRect();

        this._applyRequestID = Editor.Ipc.sendToPackage(
          "inspector",
          "popup-multiple-prefab-menu",
          {
            type: "apply",
            uuid: this.target.uuid,
            x: e.left,
            y: e.bottom + 5,
            nestedInfo: this.target.__prefab__.nestedInfo,
          }
        );
      } else {
        Editor.UI.fire(this.$el, "prefab-apply", { bubbles: true });
      }
    },
    prefabRevert() {
      if (this.target.__prefab__.hasSubPrefab) {
        if (this._revertRequestID) {
          Editor.Ipc.cancelRequest(this._revertRequestID);
          this._revertRequestID = null;
        }

        let e = this.$els.save.getBoundingClientRect();

        this._revertRequestID = Editor.Ipc.sendToPackage(
          "inspector",
          "popup-multiple-prefab-menu",
          {
            type: "revert",
            uuid: this.target.uuid,
            x: e.left,
            y: e.bottom + 5,
            nestedInfo: this.target.__prefab__.nestedInfo,
          }
        );
      } else {
        Editor.UI.fire(this.$el, "prefab-revert", { bubbles: true });
      }
    },
    prefabSetSync() {
      Editor.UI.fire(this.$el, "prefab-set-sync", { bubbles: true });
    },
    _updateActiveMulti: (e) => e.values.length > 1,
    _updateNameMulti: (e) => e.values.length > 1,
  },
});
