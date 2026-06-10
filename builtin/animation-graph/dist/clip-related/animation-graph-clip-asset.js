Object.defineProperty(exports, "__esModule", { value: true });
const UIAsset = customElements.get("ui-asset");
if (!UIAsset) {
  throw new Error("<ui-asset> 不存在。请检查执行顺序。");
}
const tagName = "animation-graph-clip-asset";
const assetType = "cc.AnimationClip";
class AnimationGraphClipAsset extends UIAsset {
  connectedCallback() {
    super.connectedCallback?.();
    this.setAttribute("droppable", assetType);
  }
  _onAreaDragOver() {
    super._onAreaDragOver?.();

    if (!this.$root.disabled) {
      this.$root.readonly;
    }
  }
}
exports.default = AnimationGraphClipAsset;

if (window && !window.customElements.get(tagName)) {
  window.customElements.define(tagName, AnimationGraphClipAsset);
}
