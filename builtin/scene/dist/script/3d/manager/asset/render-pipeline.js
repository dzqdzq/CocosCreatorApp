var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });

const edit_component_asset_1 = __importDefault(
  require("./edit-component-asset")
);

const ElectronModule = require("@base/electron-module");
const EditorExtends = ElectronModule.require("EditorExtends");
class EditRenderPipeline extends edit_component_asset_1.default {
  changeTypes = {
    _flows: { componentKey: "flow", optionalTypes: [] },
    _stages: { componentKey: "stage", optionalTypes: [] },
  };
  queryComponents(o = undefined) {
    return EditorExtends.Component.getMenus()
      .map((e) => {
        var t = `hidden:render_${o}/`;
        return e.menuPath.includes(t) && e.component
          ? e.menuPath.replace(t, "")
          : null;
      })
      .filter(Boolean);
  }
  preview() {
    var e = cc.director.root.pipeline;

    if (e && e._uuid !== undefined && e._uuid === this.component.uuid) {
      cc.director.root.setRenderPipeline(this.component);
      cce.Engine.repaintInEditMode();
    }
  }
  modifyProp(e, t) {
    e.name = t;

    if (e.visible !== false && e.value && typeof e.value == "object") {
      var o = this.changeTypes[t];

      if (o) {
        t = this.queryComponents(o.componentKey);
        o.optionalTypes = t;
      }

      if (e.isArray && e.elementTypeData && o) {
        this.modifyProp(e.elementTypeData);
        e.elementTypeData.optionalTypes = o.optionalTypes;
      }

      for (const n in e.value) {
        if (
          typeof e.value[n] == "object" &&
          (this.modifyProp(e.value[n], n), e.isArray) &&
          o
        ) {
          e.value[n].optionalTypes = o.optionalTypes;
        }
      }
    }
  }
  encodeComponent(e) {
    var t = super.encodeComponent(e);
    return {
      name: "Pipeline",
      type: e.constructor.name,
      value: t,
      visible: true,
      readonly: false,
      optionalTypes: this.queryComponents("pipeline"),
    };
  }
  async updateComponent(e) {
    var t;

    if (
      this.component.constructor.name !== e.type &&
      (t = cc.js.getClassByName(e.type))
    ) {
      t = new t();
      this.cacheComponent(t);
    }

    return super.updateComponent(e.value);
  }
}
exports.default = new EditRenderPipeline();
