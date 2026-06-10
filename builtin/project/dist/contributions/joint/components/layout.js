Object.defineProperty(exports, "__esModule", { value: true });

exports.methods = undefined;
exports.computed = undefined;
exports.watch = undefined;
exports.props = undefined;
exports.template = undefined;

exports.data = data;
exports.mounted = mounted;

const { readFileSync } = require("fs-extra");

const { join } = require("path");

const layout_counter_1 = require("../layout-counter");
function data() {
  return { pixels: 0 };
}
async function mounted() {
  await this.updateLength();
}

exports.template = readFileSync(
  join(
    __dirname,
    "../../../../static/contributions/joint/components/layout.html"
  ),
  "utf8"
);

exports.props = ["content", "index", "blocks", "size"];

exports.watch = {
  async "content.skeleton"() {
    await this.updateLength();
  },
  async "content.clips"() {
    await this.updateLength();
  },
};

exports.computed = {};

exports.methods = {
  removeSelf() {
    this.$emit("remove");
  },
  addClip() {
    this.content.clips.push("");
  },
  removeClip(t) {
    this.content.clips.splice(t, 1);
  },
  getPercent(t, e) {
    t = (t / e / e) * 100;
    return isNaN(t) ? 0 : t.toFixed(2);
  },
  async updateLength() {
    var t = this;

    var e = await layout_counter_1.jointTextureCounter.calcJointPixel(
      t.content
    );

    t.blocks.splice(t.index, 1, {
      length: t.content.clips.length,
      pixels: e.pixel,
    });

    t.pixels = e.pixel;
  },
};
