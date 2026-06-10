function mounted() {
  this.$el.render(this.dump);
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.watch = undefined;
exports.props = undefined;
exports.template = undefined;
exports.mounted = mounted;

exports.template = `
<ui-prop
    @change="change()"
></ui-prop>
`;

exports.props = ["dump"];

exports.watch = {
  dump() {
    this.$el.render(this.dump);
  },
};

exports.methods = {
  change() {
    this.$el.dispatch("change-dump");
  },
};
