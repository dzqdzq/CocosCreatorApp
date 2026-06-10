Object.defineProperty(exports, "__esModule", { value: true });
exports.DragDropUtils = undefined;
const DroppableAssetTypes = ["cc.Material"];
const excludeTypes = ["cc.Prefab", "cc.LabelAtlas"];
class DragDropUtils {
  tipsElement = null;
  droppableAssetTypes = [];
  canDrop(e) {
    return this.droppableAssetTypes.includes(e);
  }
  async updateDroppableAssetTypes() {
    var e = await Editor.Message.request(
      "scene",
      "query-creatable-asset-types"
    );
    this.droppableAssetTypes = DroppableAssetTypes.concat(e);
  }
  async init() {
    await this.updateDroppableAssetTypes();
  }
  isSameType(t) {
    return (
      t.length !== 0 &&
      (t = this.filterAssets(t)).every((e) => e.type === t[0].type)
    );
  }
  filterAssets(e, p = []) {
    const s = [];
    const l = new Map();

    e.filter((e) => this.canDrop(e.type)).forEach((e) => {
      var [t] = e.value.split("@");
      var s = l.get(t) || [];

      if (!p.includes(e.type)) {
        s.push(e);
        l.set(t, s);
      }
    });

    l.forEach((e, t) => {
      e = e.some((e) => excludeTypes.includes(e.type))
        ? e.filter((e) => excludeTypes.includes(e.type))
        : e;

      if (e.length > 0) {
        s.push(...e);
      }
    });

    return s;
  }
  closeTips() {
    if (this.tipsElement) {
      this.tipsElement.remove();
      this.tipsElement = null;
    }
  }
  showTips(e, t, s) {
    if (!this.tipsElement) {
      this.tipsElement = document.createElement("div");
      this.tipsElement.textContent = e;
      this.tipsElement.style.position = "absolute";
      this.tipsElement.style.top = "0";
      this.tipsElement.style.left = "0";
      this.tipsElement.style.padding = "4px 8px";
      this.tipsElement.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
      this.tipsElement.style.color = "#fff";
      this.tipsElement.style.borderRadius = "4px";
      this.tipsElement.style.pointerEvents = "none";
      this.tipsElement.style.zIndex = "9999";
      document.body.appendChild(this.tipsElement);
    }

    if (this.tipsElement) {
      this.tipsElement.style.left = t + 10 + "px";
      this.tipsElement.style.top = s + 10 + "px";
    }
  }
}
exports.DragDropUtils = DragDropUtils;
exports.default = new DragDropUtils();
