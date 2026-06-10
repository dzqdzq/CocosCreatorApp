Object.defineProperty(exports, "__esModule", { value: true });

exports.methods = undefined;
exports.computed = undefined;
exports.watch = undefined;
exports.props = undefined;
exports.template = undefined;

exports.data = data;
exports.mounted = mounted;
const animation_ctrl_1 = require("../../share/animation-ctrl");
const animation_editor_1 = require("../../share/animation-editor");
const grid_ctrl_1 = require("../../share/grid-ctrl");

const { IsetEditClip } = require("../../share/ipc-event");

const { transFrameByType, timeToFrame } = require("../../utils");

const join = require("path").join;
const readFileSync = require("fs-extra").readFileSync;
function data() {
  return { spacingFrame: 1, showType: "frame", menu: [] };
}
async function mounted() {
  this.spacingFrame =
    (await animation_editor_1.animationEditor.getConfig("spacingFrame")) || 1;
  var t = await animation_editor_1.animationEditor.getConfig("showType");

  if (t) {
    this.showType = t;
  }
}

exports.template = readFileSync(
  join(__dirname, "./../../../../static/template/components/toolbar.html"),
  "utf-8"
);

exports.props = [
  "currentFrame",
  "state",
  "clipsMenu",
  "currentClip",
  "sample",
  "aniComp",
];

exports.watch = {
  showType() {
    this.$root.showType = this.showType;
  },
};

exports.computed = {
  currentTime() {
    var t = this;
    return transFrameByType(t.currentFrame, t.showType, t.sample);
  },
};

exports.methods = {
  t(t, e = "toolbar.") {
    return Editor.I18n.t("animator." + e + t);
  },
  onMouseDown(t) {
    var e = t.target.getAttribute("name");
    if (e) {
      switch (e) {
        case "jump_prev_frame": {
          animation_editor_1.animationEditor.jumpPrevFrame();
          break;
        }
        case "jump_first_frame": {
          animation_editor_1.animationEditor.jumpFirstFrame();
          break;
        }
        case "jump_next_frame": {
          animation_editor_1.animationEditor.jumpNextFrame();
          break;
        }
        case "jump_last_frame": {
          animation_editor_1.animationEditor.jumpLastFrame();
          break;
        }
        case "play":
        case "pause":
        case "stop": {
          animation_ctrl_1.animationCtrl.updatePlayState(e);
          break;
        }
        case "arrange": {
          animation_editor_1.animationEditor.spacingSelectedKeys(
            this.$refs.spacingFrame.value
          );
          break;
        }
        case "exit": {
          animation_ctrl_1.animationCtrl.exit();
          break;
        }
        case "saveClip": {
          animation_ctrl_1.animationCtrl.save();
          break;
        }
        case "addEvent": {
          animation_ctrl_1.animationCtrl.addEvent();
          break;
        }
        case "shortcuts": {
          Editor.Panel.open("shortcuts", "animator");
          break;
        }
        case "applyClipCache": {
          animation_editor_1.animationEditor.selectCacheClipToApply();
        }
      }
    }
  },
  onSpacingFrame(t) {
    this.spacingFrame = t.target.value;
    animation_editor_1.animationEditor.spacingFrame = this.spacingFrame;
  },
  changeFrameShowType(t) {
    const e = this;
    requestAnimationFrame(() => {
      e.showType = t;
      grid_ctrl_1.gridCtrl.grid.labelShowType = t;
      grid_ctrl_1.gridCtrl.grid.updateLabels();
      animation_editor_1.animationEditor.setConfig("showType", t);
    });
  },
  onTimeConfirm(e) {
    const t = this;
    e = e.target.value;
    if (/^([0-9]*)f?$/.test(e)) {
      animation_editor_1.animationEditor.updateCurrentFrame(Number(e));
    } else {
      var a = animation_ctrl_1.animationCtrl.clipConfig.sample;
      var s = e.match(/^([0-9]*)-([0-9]*)$/);
      if (s) {
        s = Number(s[1]) * a + Number(s[2]);
        animation_editor_1.animationEditor.updateCurrentFrame(s);
      } else {
        s = /^((?<m>\d((\.\d*)?))m)?(?<s>(\d((\.\d*)?)))s$/;
        if (s.test(e)) {
          var { m: e, s } = e.match(i).groups;
          let t = timeToFrame(Number(s), a);

          if (e) {
            t += Number(e) * a;
          }

          animation_editor_1.animationEditor.updateCurrentFrame(t);
        }
        requestAnimationFrame(() => {
          if (t.$refs.currentTimeRef) {
            t.$refs.currentTimeRef.value = t.currentTime;
          }
        });
      }
    }
  },
  async setCurrentClip(t) {
    var e = this;
    var t = t.target;
    if (t.value === "addClip") {
      if (e.aniComp === "cc.animation.AnimationController") {
        return void animation_editor_1.animationEditor.showToast(
          "i18n:animator.mask.editInAnimationControl",
          2000 /* 2e3 */
        );
      }
      var a = await animation_ctrl_1.animationCtrl.createAniClip();
      t.value = a || e.currentClip;
    }

    if (!(await IsetEditClip(t.value))) {
      t.value = e.currentClip;
    }
  },
};
