Object.defineProperty(exports, "__esModule", { value: true });

exports.buttonConfig = undefined;
exports.ready = undefined;
exports.update = undefined;
exports.$ = undefined;
exports.template = undefined;

const utils_1 = require("./utils");
const lodash = require("lodash");
let panel;
const methods = {
  changeRenderBackEndType(e) {
    var o = this;
    var e = e.target.value;
    o.pkgOptions.renderBackEnd =
      e === "metal"
        ? { metal: true, gles3: false }
        : { metal: false, gles3: true };
    o.emitChange("renderBackEndType", o.pkgOptions.renderBackEnd);
  },
  onDevelopTeamConfirm(e) {
    e = e.target.value;
    this.pkgOptions.developerTeam = e;
    panel.dispatch("update", `packages.${panel.pkgName}.developerTeam`, e);
  },
  onTargetConfirm(e, o = "osTarget") {
    var t = this;
    lodash.set(t.pkgOptions, o, e);

    t.pkgErrorMap.osTarget = utils_1.verificationFunc(
      "osTarget",
      t.pkgOptions.osTarget
    ).error;

    panel.dispatch(
      "update",
      `packages.${panel.pkgName}.osTarget`,
      t.pkgOptions.osTarget,
      t.pkgErrorMap.osTarget
    );
  },
  onVersionConfirm(e) {
    var o = this;
    var t = utils_1.checkTargetVersion(e, panel.options);
    o.pkgErrorMap.targetVersion = t.error;
    o.pkgOptions.targetVersion = e;
    o.emitChange("targetVersion");
  },
  emitChange(e) {
    panel.dispatch(
      "update",
      `packages.${panel.pkgName}.` + e,
      this.pkgOptions.targetVersion,
      this.pkgErrorMap[e]
    );
  },
  init() {
    var e = this;

    e.pkgOptions = lodash.get(
      panel.options,
      "packages." + panel.options.platform
    ) || { targetVersion: "12.0" };

    e.onVersionConfirm(e.pkgOptions.targetVersion);
    e.onTargetConfirm(e.pkgOptions.osTarget, "osTarget");
    e.pkgErrorMap = JSON.parse(JSON.stringify(e.pkgErrorMap));
  },
  updateTeamInfo() {
    var e = Editor.Message.request("ios", "query-team-info");
    this.updateTeamList(e);
  },
  updateTeamList(e) {
    var o = this;

    if (e && e.length) {
      o.developerTeamList = e.map((e) => ({
        value: e.outputValue,
        label: e.fullValue,
      }));

      o.pkgOptions.developerTeam ||
        ((o.pkgOptions.developerTeam = o.developerTeamList[0].value),
        panel.dispatch(
          "update",
          `packages.${panel.pkgName}.developerTeam`,
          o.pkgOptions.developerTeam
        ));
    }
  },
};
async function mounted() {
  var e = this;

  e.dev = Editor.App.dev;
  e.init();
  var o = await Editor.Profile.getConfig("ios", "teamsInfo");

  e.updateTeamList(o);
}
function update(e, o) {
  panel = this;

  if (
    !o ||
    o.startsWith("pacakges." + panel.pkgName) ||
    o === "packages.native.JobSystem"
  ) {
    panel.options = e;
    panel.vm.init();
  }
}
function ready(e, o, t, a) {
  panel = this;
  var i = require("vue/dist/vue.js");
  panel.options = e;
  panel.pkgName = t;

  panel.vm = new i({
    el: panel.$.root,
    methods,
    data() {
      return {
        pkgOptions: {},
        pkgErrorMap: {},
        dev: false,
        developerTeamList: [],
      };
    },
    mounted,
    components: {
      "build-prop": BuildPanel.vueComps.buildProp,
      "template-comp": BuildPanel.vueComps.templateComp,
    },
  });
}

exports.template = `
<div class="ios" v-if="pkgOptions">
    <ui-prop>
        <ui-label slot="label" value="i18n:ios.options.render_back_end"></ui-label>
        <div slot="content">METAL</div>
    </ui-prop>
    <ui-prop>
        <ui-label slot="label" value="i18n:ios.options.developerTeam"></ui-label>
        <div slot="content">
            <ui-select
                v-if="developerTeamList.length"
                :value="pkgOptions.developerTeam"
                @confirm="onDevelopTeamConfirm"
            >
                <option v-for="item in developerTeamList" :value="item.value">{{item.label}}</option>
            </ui-select>
            <ui-label style="opacity: 0.5" v-else value="i18n:ios.tips.developerTeamListError"></ui-label>
            <ui-button @click="updateTeamInfo"><ui-label value="i18n:ios.options.queryAgain"></ui-label></ui-button>
        </div>
    </ui-prop>
    <build-prop :error="pkgErrorMap.targetVersion">
        <ui-prop class="no-wrap" :error="!!pkgErrorMap.targetVersion">
            <ui-label slot="label" value="i18n:ios.options.targetVersion"></ui-label>
            <ui-input
                slot="content"
                placeholder="i18n:ios.tips.targetVersionDefault"
                :value="pkgOptions.targetVersion"
                @confirm="onVersionConfirm($event.target.value)"
            ></ui-input>
        </ui-prop>
    </build-prop>
    <build-prop :error="pkgErrorMap.osTarget">
        <ui-prop
        >
            <ui-label slot="label" value="i18n:ios.options.os_target"></ui-label>
            <div slot="content">
                <ui-checkbox @confirm="onTargetConfirm($event.target.value, 'osTarget.iphoneos')" :value="pkgOptions.osTarget && pkgOptions.osTarget.iphoneos">
                    <ui-label value="i18n:ios.options.iphone_os"></ui-label>
                </ui-checkbox>
                <ui-checkbox @confirm="onTargetConfirm($event.target.value, 'osTarget.simulator')" :value="pkgOptions.osTarget && pkgOptions.osTarget.simulator">
                    <ui-label value="i18n:ios.options.ios_simulator"></ui-label>
                </ui-checkbox>
            </div>
        </ui-prop>
    </build-prop>
</div>
`;

exports.$ = { root: ".ios" };
exports.update = update;
exports.ready = ready;

exports.buttonConfig = {
  configs: {
    make: { label: "i18n:windows.make.label", hookHandle: "make" },
    run: { label: "i18n:windows.run.label", hookHandle: "run" },
  },
};
