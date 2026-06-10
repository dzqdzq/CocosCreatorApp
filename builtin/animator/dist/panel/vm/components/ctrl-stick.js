Object.defineProperty(exports, "__esModule", { value: true });

exports.methods = undefined;
exports.components = undefined;
exports.computed = undefined;
exports.props = undefined;
exports.template = undefined;

exports.data = data;
exports.mounted = mounted;
const animation_editor_1 = require("../../share/animation-editor");
const global_data_1 = require("../../share/global-data");
function data() {
  return {};
}
function mounted() {}

exports.template = `
<div class="ctrl-stick"
    :style="stickStyle"
    @mousedown.stop="onMouseDown"
>
    <div :class="name"><div class="info">{{frame}}</div></div>
</div>
`;

exports.props = ["selectKey", "stickInfo", "name"];

exports.computed = {
  stickStyle() {
    var t;
    var e;
    var o;
    var s;
    var a = this;
    return a.stickInfo
      ? (({ width: t, height: e, left: o, top: s } = a.stickInfo),
        a.name === "left"
          ? `left: ${o}px; top: ${s}px;height: ${e}px;`
          : `left: ${o + t}px; top: ${s}px; height: ${e}px;`)
      : null;
  },
  frame() {
    return this.stickInfo && this.stickInfo[this.name + "Frame"];
  },
};

exports.components = {};

exports.methods = {
  onMouseDown(t) {
    var e;
    var o;

    if (this.selectKey && t.button !== 2) {
      global_data_1.Flags.mouseDownName = "stick";
      e = t.target.className;
      o = {};

      o.cacheData = JSON.parse(JSON.stringify(this.selectKey.keyFrames));

      o.startX = t.x;
      o.width = animation_editor_1.animationEditor.stickInfo.width;
      o.type = e;
      global_data_1.Flags.startDragStickInfo = o;
    }
  },
};
