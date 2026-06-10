Object.defineProperty(exports, "__esModule", { value: true });

exports.methods = undefined;
exports.components = undefined;
exports.computed = undefined;
exports.watch = undefined;
exports.props = undefined;
exports.template = undefined;

exports.data = data;
exports.mounted = mounted;

const { join } = require("path");

const animation_ctrl_1 = require("../../share/animation-ctrl");
const animation_editor_1 = require("../../share/animation-editor");

exports.template = `
<section class="mask tips-mask"
  @confirm="onConfirm"
>
  <div v-if="currentState === 'disableEditInPreview'" class="tips">
      <ui-label class="message" value="i18n:animator.mask.preview_disable_animation"></ui-label>
  </div>
  <div v-else-if="!root" class="tips clip">
      <ui-label class="message" value="i18n:animator.mask.need_select_node"></ui-label>
  </div>
  <div v-else-if="root && active === false" class="tips comp">
      <ui-label value="i18n:animator.mask.node_active_false"></ui-label>
  </div>
  <ui-drag-area v-else droppable="cc.AnimationClip" @drop="onDrop">
      <div v-if="currentState === 'enterAniMode'" class="tips animationMode">
          <ui-button name="enter_animation_mode">
              <ui-label value="i18n:animator.mask.enter_animation_mode"></ui-label>
          </ui-button>
      </div>
      <div v-if="currentState === 'needAniComponent'" class="tips comp">
          <ui-label value="i18n:animator.mask.need_animation_component"></ui-label>
          <ui-link @click="onConfirm($event, 'add_animation_component')">
              <ui-label value="i18n:animator.mask.add_animation_component"></ui-label>
          </ui-link>
      </div>
      <div v-if="currentState === 'needAniClip'" class="tips clip">
          <ui-label value="i18n:animator.mask.need_animation_clip"></ui-label>
          <ui-label v-if="aniComp === 'cc.animation.AnimationController'" value="i18n:animator.mask.editInAnimationControl"></ui-label>
          <template v-else>
              <ui-link @click="onConfirm">
                  <ui-label name="create_animation_clip" value="i18n:animator.mask.create_animation_clip"></ui-label>
              </ui-link>
              <ui-label value="i18n:animator.mask.or"></ui-label>
              <ui-link @click="onConfirm">
                  <ui-label name="select_animation_clip" value="i18n:animator.tips.select_animation_clip"></ui-label>
              </ui-link>
          </template>
      </div>
      <div v-if="aniComp !== 'cc.animation.AnimationController'">
          (<ui-label value="i18n:animator.mask.create_from_clip"></ui-label>)
      </div>
  </ui-drag-area>
</section>
`;

const ASSET_DB = "db://assets";
const ASSET_Dir = join(Editor.Project.path, "assets");
function data() {
  return {};
}
function mounted() {}

exports.props = [
  "root",
  "aniComp",
  "currentClip",
  "animationMode",
  "active",
  "currentSceneMode",
];

exports.watch = {};

exports.computed = {
  currentState() {
    var { active, root, currentClip, aniComp, currentSceneMode } = this;
    return currentSceneMode === "preview"
      ? "disableEditInPreview"
      : root
      ? active === false
        ? "needActiveNode"
        : aniComp || currentClip
        ? currentClip
          ? "enterAniMode"
          : "needAniClip"
        : "needAniComponent"
      : "needSelectNode";
  },
};

exports.components = {};

exports.methods = {
  t(i) {
    return Editor.I18n.t("animator.mask." + i);
  },
  async onConfirm(i, a) {
    var e;
    switch ((a = a || i.target.getAttribute("name"))) {
      case "enter_animation_mode": {
        animation_ctrl_1.animationCtrl.enter(this.currentClip);
        break;
      }
      case "add_animation_component": {
        animation_ctrl_1.animationCtrl.addAnimationComponent();
        break;
      }
      case "create_animation_clip": {
        if (!animation_ctrl_1.animationCtrl.isCreatingAniClip) {
          if ((e = await animation_ctrl_1.animationCtrl.createAniClip())) {
            await animation_ctrl_1.animationCtrl.enter(e);
          }
        }

        break;
      }
      case "select_animation_clip": {
        Editor.Panel.__protected__.openKit("ui-kit.searcher", {
          elem: i.target,
          params: [{ type: "asset", value: "", droppable: "cc.AnimationClip" }],
          listeners: {
            confirm: async (i) => {
              if (i) {
                if (
                  await animation_ctrl_1.animationCtrl.addClipFromAsset([
                    { value: i.value, name: i.info.name },
                  ])
                ) {
                  await animation_ctrl_1.animationCtrl.enter(i.value);
                } else {
                  console.debug(`addClipFromAsset ${i.value} falied!`);
                }
              }
            },
          },
        });
      }
    }
  },
  async onDrop(i) {
    var a = Editor.UI.__protected__.DragArea.currentDragInfo;
    if (a.type === "cc.AnimationClip") {
      a = a.additional.filter((i) => i.type === "cc.AnimationClip");
      if (a.length) {
        var e = a.map((i) => i.value);
        if (this.currentState === "needAniComponent") {
          await animation_ctrl_1.animationCtrl.createAniCompFromAsset(a);
        } else {
          if (this.aniComp === "cc.animation.AnimationController") {
            return void animation_editor_1.animationEditor.showToast(
              "i18n:animator.mask.editInAnimationControl",
              2000 /* 2e3 */
            );
          }
          await animation_ctrl_1.animationCtrl.addClipFromAsset(a);
        }
        await animation_ctrl_1.animationCtrl.enter(e[0]);
      }
    }
  },
};
