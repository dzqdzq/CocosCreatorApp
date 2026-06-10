var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.state = undefined;
exports.load = load;
exports.unload = unload;
exports.beforeClose = beforeClose;

const { instantiateIPCMethods } = require("./make-life-easier-utils");

const scene_animation_graph_1 = __importDefault(
  require("./scene-animation-graph")
);
const SceneMotionPreview = cce.Preview.motionPreview;
const SceneTransitionPreview = cce.Preview.transitionPreview;
function load() {}
function unload() {}
async function beforeClose() {
  if (!exports.state.closing) {
    exports.state.closing = true;

    if (scene_animation_graph_1.default.dirtyData.isDirty()) {
      var e = await scene_animation_graph_1.default.dialog();
      if (e === 0) {
        await scene_animation_graph_1.default.apply();
      } else if (e === 1) {
        scene_animation_graph_1.default.reset();
      } else if (e === 2) {
        return (exports.state.closing = false);
      }
    }

    scene_animation_graph_1.default.unselect();
    exports.state.closing = false;
  }
  return true;
}
exports.state = { closing: false };

exports.methods = {
  async beforeClose() {
    return await beforeClose();
  },
  async edit(e) {
    return !(
      exports.state.closing ||
      ((exports.state.closing = true),
      await scene_animation_graph_1.default.edit(e),
      SceneTransitionPreview.reset(),
      SceneMotionPreview.reset(),
      (exports.state.closing = false))
    );
  },
  ...instantiateIPCMethods(scene_animation_graph_1.default),
  async changeView(e, n, i) {
    scene_animation_graph_1.default.changeView(e, n, i);

    if (Array.isArray(i)) {
      await this.showMotionPreview();
    }
  },
  removeMotionInMotion(e) {
    if (
      scene_animation_graph_1.default.getMotionByLevel(e) ===
      SceneMotionPreview.motion
    ) {
      SceneMotionPreview.hide();
    }

    scene_animation_graph_1.default.removeMotionInMotion(e);
  },
  changeMotionAutoThreshold(e, n) {
    scene_animation_graph_1.default.changeMotionAutoThreshold(e, n);

    if (
      scene_animation_graph_1.default.getMotionByLevel(e) ===
      SceneMotionPreview.motion
    ) {
      SceneMotionPreview.setProp();
    }
  },
  changeMotionThreshold1D(e, n, i) {
    scene_animation_graph_1.default.changeMotionThreshold1D(e, n, i);

    if (
      scene_animation_graph_1.default.getMotionByLevel(e) ===
      SceneMotionPreview.motion
    ) {
      SceneMotionPreview.setProp();
    }
  },
  changeMotionThreshold2D(e, n, i) {
    scene_animation_graph_1.default.changeMotionThreshold2D(e, n, i);

    if (
      scene_animation_graph_1.default.getMotionByLevel(e) ===
      SceneMotionPreview.motion
    ) {
      SceneMotionPreview.setProp();
    }
  },
  changeMotionProp(...e) {
    scene_animation_graph_1.default.changeMotionProp(...e);
    var [e] = e;

    if (
      scene_animation_graph_1.default.getMotionByLevel(e) ===
      SceneMotionPreview.motion
    ) {
      SceneMotionPreview.setProp();
    }
  },
  changeClipMotionInMotion(e, n) {
    scene_animation_graph_1.default.changeClipMotionInMotion(e, n);

    if (
      scene_animation_graph_1.default.getMotionByLevel(e) ===
      SceneMotionPreview.motion
    ) {
      SceneMotionPreview.setProp();
    }
  },
  changeAnimationBlend1DInMotion(e, n, i) {
    scene_animation_graph_1.default.changeAnimationBlend1DInMotion(e, n, i);

    if (
      scene_animation_graph_1.default.getMotionByLevel(e) ===
      SceneMotionPreview.motion
    ) {
      SceneMotionPreview.setProp();
    }
  },
  changeAnimationBlend2DInMotion(e, n, i, t) {
    scene_animation_graph_1.default.changeAnimationBlend2DInMotion(e, n, i, t);

    if (
      scene_animation_graph_1.default.getMotionByLevel(e) ===
      SceneMotionPreview.motion
    ) {
      SceneMotionPreview.setProp();
    }
  },
  hideMotionPreview() {
    SceneMotionPreview.hide();
  },
  async showMotionPreview() {
    var e;

    if (!SceneMotionPreview.hasModel()) {
      if ((e = await scene_animation_graph_1.default.queryPreviewModel())) {
        await SceneMotionPreview.setModel(e);
      }
    }

    return SceneMotionPreview.show(
      scene_animation_graph_1.default.getCurrentMotion(),
      scene_animation_graph_1.default.animationGraph
    );
  },
  playMotionPreview() {
    SceneMotionPreview.play();
  },
  pauseMotionPreview() {
    SceneMotionPreview.pause();
  },
  stopMotionPreview() {
    SceneMotionPreview.stop();
  },
  setTimeMotionPreview(e) {
    SceneMotionPreview.setTime(e);
  },
  addTransition(e, n) {
    e = scene_animation_graph_1.default.addTransition(e, n);

    if (e) {
      SceneTransitionPreview.show(
        e,
        scene_animation_graph_1.default.stateMachine,
        scene_animation_graph_1.default.animationGraph
      );
    }
  },
  viewTransition(e) {
    scene_animation_graph_1.default.viewTransition(e);
    e = scene_animation_graph_1.default.getTransition(e);

    if (
      !SceneTransitionPreview.transition ||
      e !== SceneTransitionPreview.transition
    ) {
      SceneTransitionPreview.show(
        e,
        scene_animation_graph_1.default.stateMachine,
        scene_animation_graph_1.default.animationGraph
      );
    }
  },
  removeTransition(e, n) {
    if (
      scene_animation_graph_1.default.getTransition(e) ===
      SceneTransitionPreview.transition
    ) {
      SceneTransitionPreview.hide();
    }

    scene_animation_graph_1.default.removeTransition(e, n);
  },
  changeTransitionProp(e, n, i) {
    scene_animation_graph_1.default.changeTransitionProp(e, n, i);

    if (
      scene_animation_graph_1.default.getTransition(e) ===
      SceneTransitionPreview.transition
    ) {
      SceneTransitionPreview.setProp();
    }
  },
  hideTransitionPreview() {
    SceneTransitionPreview.hide();
  },
  async showTransitionPreview(e) {
    if (!SceneTransitionPreview.hasModel()) {
      if ((n = await scene_animation_graph_1.default.queryPreviewModel())) {
        await SceneTransitionPreview.setModel(n);
      }
    }

    var n = scene_animation_graph_1.default.getTransition(e);
    return SceneTransitionPreview.show(
      n,
      scene_animation_graph_1.default.stateMachine,
      scene_animation_graph_1.default.animationGraph
    );
  },
  playTransitionPreview() {
    SceneTransitionPreview.play();
  },
  pauseTransitionPreview() {
    SceneTransitionPreview.pause();
  },
  stopTransitionPreview() {
    SceneTransitionPreview.stop();
  },
  setTimeTransitionPreview(e) {
    SceneTransitionPreview.setTime(e);
  },
  async setPreviewModel(e) {
    await scene_animation_graph_1.default.setPreviewModel(e);
    await SceneTransitionPreview.setModel(e);
    await SceneMotionPreview.setModel(e);
  },
  updatePreviewVariable(e) {
    if (SceneTransitionPreview.active) {
      SceneTransitionPreview.updateVariable(e);
    }

    if (SceneMotionPreview.active) {
      SceneMotionPreview.updateVariable(e);
    }
  },
};
