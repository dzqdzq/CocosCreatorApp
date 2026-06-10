var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneFacadeFSM = undefined;
exports.createSceneFacadeFSM = createSceneFacadeFSM;
const scene_facade_state_interface_1 = require("./scene-facade-state-interface");

const animation_scene_facade_1 = __importDefault(
  require("./animation-scene-facade")
);

const general_scene_facade_1 = __importDefault(
  require("./general-scene-facade")
);
const prefab_scene_facade_1 = __importDefault(require("./prefab-scene-facade"));
const preview_scene_facade_1 = __importDefault(
  require("./preview-scene-facade")
);

const finite_state_machine_1 = __importDefault(
  require("../utils/state-machine/finite-state-machine")
);

const scene_facade_state_transition_1 = require("./scene-facade-state-transition");
const generalFacade = new general_scene_facade_1.default();
const animationFacade = new animation_scene_facade_1.default();
const prefabFacade = new prefab_scene_facade_1.default();
const previewFacade = new preview_scene_facade_1.default();
const sceneFacades = [
  generalFacade,
  animationFacade,
  prefabFacade,
  previewFacade,
];
let init = false;
class SceneFacadeFSM extends finite_state_machine_1.default {
  generalSceneFacade = generalFacade;
  animationSceneFacade = animationFacade;
  prefabSceneFacade = prefabFacade;
  previewSceneFacade = previewFacade;
  start() {
    this.Begin(generalFacade);

    generalFacade._sceneProxy.sendModeChangeMsg(
      generalFacade.modeName.toLocaleLowerCase()
    );

    Editor.EditMode.enter(generalFacade.modeName.toLocaleLowerCase());
  }
  async toGeneral(e = {}) {
    if (!e.uuid) {
      e.uuid = this.generalSceneFacade.queryCurrentSceneUuid();
    }

    Editor.Metrics.trackTimeStart("[Metrics]Enter Mode:toGeneral");
    e = await this.issueCommand("toGeneral", e);

    Editor.Metrics.trackTimeEnd("[Metrics]Enter Mode:toGeneral", {
      output: true,
    });

    return e;
  }
  async toAnimation(e = {}) {
    Editor.Metrics.trackTimeStart("[Metrics]Enter Mode:toAnimation");
    e = await this.issueCommand("toAnimation", e);

    Editor.Metrics.trackTimeEnd("[Metrics]Enter Mode:toAnimation", {
      output: true,
    });

    return e;
  }
  async toPrefab(e = {}) {
    Editor.Metrics.trackTimeStart("[Metrics]Enter Mode:toPrefab");
    e = await this.issueCommand("toPrefab", e);

    Editor.Metrics.trackTimeEnd("[Metrics]Enter Mode:toPrefab", {
      output: true,
    });

    return e;
  }
  async toPreview(e = {}) {
    return this.issueCommand("toPreview", e);
  }
  dumpAllScenes() {
    return sceneFacades.map((e) => e.dumpSceneState());
  }
  restoreAllScenes(n) {
    sceneFacades.forEach((e, a) => {
      e.restoreSceneState(n[a]);
    });
  }
  async closeScene() {
    var e;
    var a = this.currentState;
    let n = false;
    try {
      if (
        a.modeName === scene_facade_state_interface_1.SceneModeType.Animation
      ) {
        if (
          (e = a.fromState)?.modeName ===
          scene_facade_state_interface_1.SceneModeType.General
        ) {
          n = await this.toGeneral();
        } else if (
          e.modeName === scene_facade_state_interface_1.SceneModeType.Prefab
        ) {
          n = await this.toPrefab();
        }
      } else {
        n =
          a.modeName === scene_facade_state_interface_1.SceneModeType.Prefab ||
          a.modeName === scene_facade_state_interface_1.SceneModeType.Preview
            ? await this.toGeneral()
            : (console.warn(
                "Trying to close current edit scene in general edit mode is not allowed"
              ),
              false);
      }
    } catch (e) {
      console.error("close scene Failed", e);
    }
    return n;
  }
  async closeSceneToGeneral() {
    while (
      this.currentState.modeName !==
      scene_facade_state_interface_1.SceneModeType.General
    ) {
      if (!(await this.closeScene())) {
        return false;
      }
    }
  }
}
function createSceneFacadeFSM() {
  if (!init) {
    generalFacade.init();
    animationFacade.init();
    prefabFacade.init();
    previewFacade.init();
    init = true;
  }

  var e = new SceneFacadeFSM(sceneFacades);

  e.addTransition(
    generalFacade,
    animationFacade,
    "toAnimation",
    new scene_facade_state_transition_1.ToAnimationTransition(
      generalFacade,
      animationFacade
    )
  )
    .addTransition(
      generalFacade,
      prefabFacade,
      "toPrefab",
      new scene_facade_state_transition_1.ToPrefabTransition(
        generalFacade,
        prefabFacade
      )
    )
    .addTransition(
      generalFacade,
      previewFacade,
      "toPreview",
      new scene_facade_state_transition_1.ToPreviewTransition(
        generalFacade,
        previewFacade
      )
    );

  e.addTransition(
    animationFacade,
    generalFacade,
    "toGeneral",
    new scene_facade_state_transition_1.ToGeneralTransition(
      animationFacade,
      generalFacade
    )
  )
    .addTransition(
      animationFacade,
      prefabFacade,
      "toPrefab",
      new scene_facade_state_transition_1.ToPrefabTransition(
        animationFacade,
        prefabFacade
      )
    )
    .addTransition(
      animationFacade,
      previewFacade,
      "toPreview",
      new scene_facade_state_transition_1.ToPreviewTransition(
        animationFacade,
        previewFacade
      )
    );

  e.addTransition(
    prefabFacade,
    generalFacade,
    "toGeneral",
    new scene_facade_state_transition_1.ToGeneralTransition(
      prefabFacade,
      generalFacade
    )
  )
    .addTransition(
      prefabFacade,
      animationFacade,
      "toAnimation",
      new scene_facade_state_transition_1.ToAnimationTransition(
        prefabFacade,
        animationFacade
      )
    )
    .addTransition(
      prefabFacade,
      previewFacade,
      "toPreview",
      new scene_facade_state_transition_1.ToPreviewTransition(
        prefabFacade,
        previewFacade
      )
    );

  e.addTransition(
    previewFacade,
    generalFacade,
    "toGeneral",
    new scene_facade_state_transition_1.ToGeneralTransition(
      previewFacade,
      generalFacade
    )
  )
    .addTransition(
      previewFacade,
      prefabFacade,
      "toPrefab",
      new scene_facade_state_transition_1.ToPrefabTransition(
        previewFacade,
        prefabFacade
      )
    )
    .addTransition(
      previewFacade,
      animationFacade,
      "toAnimation",
      new scene_facade_state_transition_1.ToAnimationTransition(
        previewFacade,
        animationFacade
      )
    );

  return e;
}
exports.SceneFacadeFSM = SceneFacadeFSM;
