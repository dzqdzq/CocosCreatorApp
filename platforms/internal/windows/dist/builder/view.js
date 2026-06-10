Object.defineProperty(exports, "__esModule", { value: true });

exports.ready = undefined;
exports.update = undefined;
exports.$ = undefined;
exports.template = undefined;
exports.buttonConfig = undefined;

const fs_1 = require("fs");
const path_1 = require("path");
let panel;
const lodash = require("lodash");
async function update(e, n) {
  panel = this;
  panel.options = e;
  panel.vm.init();
}
function ready(e, n, t, a) {
  panel = this;
  var s = require("vue/dist/vue.js");
  panel.options = e;
  panel.pkgName = t;
  panel.errorMap = a;

  panel.vm = new s({
    el: panel.$.root,
    methods: {
      async onConfirm(e) {
        var n = e.target.value;
        var e = e.target.getAttribute("path");
        lodash.set(this.pkgOptions, e, n);

        panel.dispatch(
          "update",
          `packages.${panel.pkgName}.renderBackEnd`,
          this.pkgOptions.renderBackEnd,
          null
        );
      },
      async onRenderBackEnd(e) {
        var n = this;
        var e = e.target.value;

        n.pkgOptions.renderBackEnd = e
          ? Object.assign(n.pkgOptions.renderBackEnd, { gles3: true })
          : Object.assign(n.pkgOptions.renderBackEnd, {
              gles2: false,
              gles3: false,
            });

        panel.dispatch(
          "update",
          `packages.${panel.pkgName}.renderBackEnd`,
          n.pkgOptions.renderBackEnd,
          null
        );
      },
      init() {
        this.pkgOptions = lodash.get(panel.options, "packages.windows") || {};
      },
    },
    data() {
      return {
        pkgOptions: {
          renderBackEnd: { vulkan: false, gles3: true, gles2: true },
        },
      };
    },
    mounted() {
      this.init();
    },
  });
}

exports.buttonConfig = {
  configs: {
    make: { label: "i18n:windows.make.label", hookHandle: "make" },
    run: { label: "i18n:windows.run.label", hookHandle: "run" },
  },
};

exports.template = fs_1.readFileSync(
  path_1.join(__dirname, "../../static/view.html"),
  "utf8"
);

exports.$ = { root: ".windows" };
exports.update = update;
exports.ready = ready;
