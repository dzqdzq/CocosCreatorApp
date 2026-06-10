function data() {
  return {};
}
function mounted() {}
Object.defineProperty(exports, "__esModule", { value: true });

exports.methods = undefined;
exports.components = undefined;
exports.computed = undefined;
exports.watch = undefined;
exports.props = undefined;
exports.template = undefined;

exports.data = data;
exports.mounted = mounted;

exports.template = `
    <div class="control-pointer"
        name = "pointer"
        :style="calcStyle"
    >
        <ui-icon value="play"></ui-icon>
        <span></span>
    </div>
`;

exports.props = ["position", "offset"];
exports.watch = {};
exports.computed = {};
exports.components = {};

exports.methods = {
  calcStyle() {
    return `transform: translateX(${0 | this.position}px);`;
  },
};
