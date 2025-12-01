"use strict";
Vue.component("cc-comp-section", {
  template:
    '\n    <ui-section>\n      <div slot="header" class="header flex-1 layout horizontal center-center">\n        <ui-checkbox hidden="{{!editor._showTick}}"\n          v-value="target.enabled.value"\n          v-values="target.enabled.valuse"\n          :multi-values="_updateEnabelMulti(target.enabled)"\n        ></ui-checkbox>\n        <span @dragstart="dragstart" @dragend="dragend" draggable="true">{{name}}</span>\n        <span class="flex-1"></span>\n        <ui-button class="tiny transparent"\n          title="{{T(\'INSPECTOR.component.help\')}}"\n          hidden="{{!editor.help}}"\n          @click="openHelpClick"\n          >\n          <i class="fa fa-book"></i>\n        </ui-button>\n        <ui-button v-el:dropdown class="tiny transparent"\n          title=""\n          @click="menuClick"\n          >\n          <i class="fa fa-cog"></i>\n        </ui-button>\n      </div>\n\n      <template v-if="!customDraw()">\n        <template v-for="prop in target">\n          <component\n            v-if="prop.attrs.visible !== false"\n            :is="prop.compType"\n            :target.sync="prop"\n            :indent="0"\n            :multi-values="multi"\n          ></component>\n        </template>\n      </template>\n    </ui-section>\n  ',
  props: {
    name: { twoWay: true, type: String },
    editor: { twoWay: true, type: Object },
    target: { twoWay: true, type: Object },
    index: { type: Number },
    count: { type: Number },
    multi: { type: Boolean },
  },
  methods: {
    T: Editor.T,
    dragstart(t) {
      t.stopPropagation();

      Editor.UI.DragDrop.start(t.dataTransfer, {
        buildImage: true,
        effect: "copyMove",
        type: "component",
        items: [{ id: this.target.uuid.value, name: this.name }],
      });
    },
    dragend() {
      Editor.UI.DragDrop.end();
    },
    customDraw() {
      return this.editor && this.editor.inspector;
    },
    menuClick(t) {
      t.stopPropagation();

      if (this._requestID) {
        Editor.Ipc.cancelRequest(this._requestID);
        this._requestID = null;
      }

      this._requestID = Editor.Ipc.sendToPanel(
          "scene",
          "scene:has-copied-component",
          (t, e) => {
            let n = this.$els.dropdown.getBoundingClientRect();
            let i = this.target.node.values.map((t) => t.uuid) || [];
            let o = this.target.uuid.values;
            Editor.Ipc.sendToPackage(
              "inspector",
              "popup-component-inspector-menu",
              {
                nodeUuids: i,
                compUuids: o,
                hasCopyComp: e,
                multi: this.multi,
                compIndex: this.index,
                compCount: this.count,
                x: n.left,
                y: n.bottom + 5,
              }
            );
          },
          -1
        );
    },
    openHelpClick(t) {
      t.stopPropagation();
      let e = this.editor.help;

      if (e.startsWith("i18n:")) {
        e = Editor.T(e.replace("i18n:", ""));
      }

      require("electron").shell.openExternal(e);
    },
    _updateEnabelMulti(t) {
      var e = t.values;
      var n = e[0];
      return !e.every((t) => t == n);
    },
  },
  compiled() {
    if (this.customDraw()) {
      Editor.import(this.editor.inspector).then((t) => {
        if (!t || "function" != typeof t) {
          Editor.warn(
            `Failed to load inspector ${this.editor.inspector} for component "${this.name}"`
          );

          return;
        }
        function e() {
          let e = document.createElement("div");
          this.$el.appendChild(e);

          new t({
            el: e,
            propsData: { target: this.target, multi: this.multi },
          });
        }

        if (t.options && t.options.dependencies && t.options.dependencies.length) {
          Editor.import(t.options.dependencies).then(() => {
                e.call(this);
              });
        } else {
          e.call(this);
        }
      });
    }
  },
});
