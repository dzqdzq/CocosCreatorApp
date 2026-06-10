Object.defineProperty(exports, "__esModule", { value: true });
exports.$ = undefined;
exports.template = undefined;
exports.style = undefined;
exports.update = update;
exports.ready = ready;

const { verificationFunc } = require("./utils");

const { readFileSync } = require("fs");

const { join } = require("path");

const lodash = require("lodash");
let panel;

const defaultOptions = {
  packageName: "",
  executableName: "",
  orientation: {
    portrait: false,
    upsideDown: false,
    landscapeRight: true,
    landscapeLeft: true,
  },
  renderBackEnd: { metal: true, gles3: true, gles2: false },
  osTarget: { iphoneos: false, simulator: true },
  developerTeam: "",
  targetVersion: "",
  skipUpdateXcodeProject: false,
};

exports.style = `
.developer-team-select,
.developer-team-input {
  margin-bottom: 5px;
}
`;

const methods = {
  t(e, t) {
    return Editor.I18n.t("ios." + e, t);
  },
  changeRenderBackEndType(e) {
    var t = this;
    var e = e.target.value;
    t.pkgOptions.renderBackEnd =
      e === "metal"
        ? { metal: true, gles3: false }
        : { metal: false, gles3: true };
    t.emitChange("renderBackEndType", t.pkgOptions.renderBackEnd);
  },
  async onChange(e) {
    var t;
    var a = this;
    var p = e.target.value;
    var e = e.target.getAttribute("path");

    if (e) {
      lodash.set(a.pkgOptions, e, p);
      t = await verificationFunc(e, a.pkgOptions[e], panel.options);
      a.pkgErrorMap[e] = t.error;
      a.emitChange(e, p, a.pkgErrorMap[e]);
    }
  },
  emitChange(e, t, a) {
    panel.dispatch("update", `packages.${panel.pkgName}.` + e, t, a);
  },
  init() {
    var e = this;
    e.pkgOptions = lodash.get(
      panel.options,
      "packages." + panel.options.platform
    ) || { targetVersion: "12.0" };
    for (const a of Object.keys(defaultOptions)) {
      var t = verificationFunc(a, e.pkgOptions[a], panel.options);
      e.pkgErrorMap[a] = t.error;
    }
    panel.dispatch(
      "update",
      "packages." + panel.pkgName,
      e.pkgOptions,
      e.pkgErrorMap
    );
  },
  developerTeamSelectChanged(e) {
    var t = this;
    var e = e.target.value;
    t.developerTeamSelect = e;
    t.pkgOptions.developerTeam = e === "custom" ? "" : e;
    t.emitChange("developerTeam", t.pkgOptions.developerTeam);
  },
  async updateTeamInfo() {
    var e = this;
    e.teams = await Editor.Message.request("ios", "query-team-info");
    e.updateTeamList(e.teams);
  },
  updateTeamList(e) {
    const t = this;

    if (e && e.length) {
      t.developerTeamList = e.map((e) => ({
        value: e.outputValue + "_" + e.hash,
        label: e.fullValue,
        error: e.errorState ? "Error: " + e.errorState : "",
      }));

      t.pkgOptions.developerTeam
        ? (t.developerTeamSelect =
            -1 ===
            t.developerTeamList.findIndex(
              (e) => e.value === t.pkgOptions.developerTeam
            )
              ? "custom"
              : t.pkgOptions.developerTeam)
        : t.type === "new" &&
          t.developerTeamSelect !== "custom" &&
          ((e = t.developerTeamList.find((e) => !e.error)),
          (t.developerTeamSelect = t.pkgOptions.developerTeam =
            e ? e.value : ""),
          t.emitChange("developerTeam", t.pkgOptions.developerTeam));
    } else {
      t.developerTeamSelect = "custom";
    }
  },
};

async function mounted() {
  var e = this;
  e.dev = Editor.App.dev;
  e.pkgOptions =
    lodash.get(panel.options, "packages." + panel.options.platform) || {};
  e.pkgErrorMap = {};

  if (e.type !== "check") {
    e.init();
    e.updateTeamList(e.teams);
  }

  await e.updateTeamInfo();
}
function update(e, t) {
  panel = this;

  if (
    !t ||
    t.startsWith("packages." + panel.pkgName) ||
    t === "packages.native.JobSystem"
  ) {
    panel.options = e;
    panel.vm.init();
  }
}
function ready(e, t, a, p) {
  panel = this;
  var BuildPanel_Vue = BuildPanel.Vue;
  panel.options = e;
  panel.pkgName = a;

  panel.vm = new BuildPanel_Vue({
    el: panel.$.root,
    data() {
      return {
        pkgOptions: defaultOptions,
        pkgErrorMap: defaultOptions,
        dev: false,
        type: t,
        developerTeamList: [],
        developerTeamSelect: "",
      };
    },
    mounted,
    methods,
  });
}

exports.template = readFileSync(
  join(__dirname, "../../static/view.html"),
  "utf8"
);

exports.$ = { root: ".ios" };
