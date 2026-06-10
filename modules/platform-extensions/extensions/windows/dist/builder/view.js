Object.defineProperty(exports, "__esModule", { value: true });
exports.$ = undefined;
exports.template = undefined;
exports.ready = ready;
exports.update = update;

const { readFileSync } = require("fs");

const { join } = require("path");

const { queryVisualStudioVersion } = require("./utils");

const lodash = require("lodash");
let panel;
const defaultOptions = {
  renderBackEnd: { vulkan: false, gles3: true, gles2: false },
};
function ready(e, a, t, n) {
  panel = this;
  var BuildPanel_Vue = BuildPanel.Vue;
  panel.options = e;
  panel.pkgName = t;
  panel.errorMap = n;

  panel.vm = new BuildPanel_Vue({
    el: panel.$.root,
    data() {
      return { pkgOptions: defaultOptions, pkgErrorMap: {}, vsData: [] };
    },
    mounted() {
      this.init();
    },
    methods: {
      t(e, a) {
        return Editor.I18n.t("windows." + e, a);
      },
      async init() {
        var e = this;

        e.pkgOptions = lodash.get(panel.options, "packages.windows") || {};
        var a = await Editor.Profile.getConfig("windows", "vsData");

        var a =
          (a
            ? (e.vsData = a)
            : ((e.vsData = []),
              (a = await queryVisualStudioVersion()),
              (e.vsData = a || []),
              await Editor.Profile.setConfig("windows", "vsData", e.vsData)),
          e.vsData.length > 0 ? e.vsData[0].value : "");

        var a =
          (e.pkgOptions.vsData ||
            e.type !== "new" ||
            ((e.pkgOptions.vsData = a),
            lodash.set(panel.options, "packages.windows.vsData", a)),
          await verificationFunc("renderBackEnd", e.pkgOptions.renderBackEnd));

        e.$set(e.pkgErrorMap, "renderBackEnd", a.error);
        e.emitChange();
      },
      async onGLES23Change(e) {
        var a = this;
        var e = e.target.value;

        var e =
          ((a.pkgOptions.renderBackEnd = e
            ? Object.assign(a.pkgOptions.renderBackEnd, { gles3: true })
            : Object.assign(a.pkgOptions.renderBackEnd, {
                gles2: false,
                gles3: false,
              })),
          await verificationFunc("renderBackEnd", a.pkgOptions.renderBackEnd));

        a.$set(a.pkgErrorMap, "renderBackEnd", e.error);

        panel.dispatch(
          "update",
          `packages.${panel.pkgName}.renderBackEnd`,
          a.pkgOptions.renderBackEnd,
          e.error
        );
      },
      async onChange(e) {
        var a = this;
        var t = e.target.value;
        var e = e.target.getAttribute("path");
        lodash.set(a.pkgOptions, e, t);

        if (e && e.startsWith("renderBackEnd.")) {
          t = await verificationFunc(
            "renderBackEnd",
            a.pkgOptions.renderBackEnd
          );

          a.$set(a.pkgErrorMap, "renderBackEnd", t.error);
        }

        a.emitChange();
      },
      async onVsData(e) {
        var a = await queryVisualStudioVersion();
        var a = ((this.vsData = a || []), a.length > 0 ? a[0].value : "");
        lodash.set(panel.options, "packages.windows.vsData", a);
        await Editor.Profile.setConfig("windows", "vsData", this.vsData);
      },
      emitChange() {
        panel.dispatch(
          "update",
          "packages." + panel.pkgName,
          this.pkgOptions,
          this.pkgErrorMap
        );
      },
    },
  });
}
function update(e, a) {
  panel = this;

  if (!a || a.startsWith("packages." + panel.pkgName)) {
    panel.options = e;
    panel.vm.init();
  }
}
async function verificationFunc(e, a) {
  var t = { error: "", newValue: a, level: "error" };

  if (e === "renderBackEnd" && Object.keys(a).every((e) => !a[e])) {
    t.error = Editor.I18n.t("windows.tips.at_least_one");
  }

  return t;
}

exports.template = readFileSync(
  join(__dirname, "../../static/view.html"),
  "utf8"
);

exports.$ = { root: ".windows" };
