Object.defineProperty(exports, "__esModule", { value: true });

exports.ToPreviewTransition = undefined;
exports.ToPrefabTransition = undefined;
exports.ToGeneralTransition = undefined;
exports.ToAnimationTransition = undefined;

const scene_facade_state_interface_1 = require("./scene-facade-state-interface");
const transition_1 = require("../utils/state-machine/transition");
class ToAnimationTransition extends transition_1.Transition {
  constructor(e, t, n = null) {
    super(e, t, n);
  }
  async testCondition() {
    if (
      this.fromState.modeName !==
        scene_facade_state_interface_1.SceneModeType.General &&
      this.fromState.modeName !==
        scene_facade_state_interface_1.SceneModeType.Prefab
    ) {
      this.fromState.setCloseSceneWhenExit();
    }

    return true;
  }
  async Complete() {
    super.Complete();

    if (
      this.fromState.modeName ===
        scene_facade_state_interface_1.SceneModeType.General ||
      this.fromState.modeName ===
        scene_facade_state_interface_1.SceneModeType.Prefab
    ) {
      this.fromState.isHold = true;
      await this.fromState.stagingSceneState();
    }
  }
}
exports.ToAnimationTransition = ToAnimationTransition;
class ToGeneralTransition extends transition_1.Transition {
  constructor(e, t, n = null) {
    super(e, t, n);
  }
  async testCondition() {
    return (
      !!(await this.fromState.checkToClose()) &&
      (this.fromState.setCloseSceneWhenExit(), true)
    );
  }
}
exports.ToGeneralTransition = ToGeneralTransition;
class ToPreviewTransition extends transition_1.Transition {
  constructor(e, t, n = null) {
    super(e, t, n);
  }
  async Complete() {
    super.Complete();
  }
}
exports.ToPreviewTransition = ToPreviewTransition;
class ToPrefabTransition extends transition_1.Transition {
  constructor(e, t, n = null) {
    super(e, t, n);
  }
  async testCondition() {
    return (
      this.fromState.modeName ===
        scene_facade_state_interface_1.SceneModeType.General ||
      (!!(await this.fromState.checkToClose()) &&
        (this.fromState.setCloseSceneWhenExit(), true))
    );
  }
  async Complete() {
    super.Complete();

    if (
      this.fromState.modeName ===
      scene_facade_state_interface_1.SceneModeType.General
    ) {
      this.fromState.isHold = true;
      await this.fromState.stagingSceneState();
    }
  }
}
exports.ToPrefabTransition = ToPrefabTransition;
