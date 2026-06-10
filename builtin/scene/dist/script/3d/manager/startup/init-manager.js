var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
const scene_facade_manager_1 = require("../../facade/scene-facade-manager");
const log_1 = __importDefault(require("./log"));
exports.initManager = async () => {
  log_1.default.init();
  var window_cce = window.cce;
  var a = new cc.Node("Editor Scene Foreground");
  var c = new cc.Node("Editor Scene Background");

  var a =
    ((a.objFlags |= cc.Object.Flags.DontSave | cc.Object.Flags.HideInHierarchy),
    (c.objFlags |= cc.Object.Flags.DontSave | cc.Object.Flags.HideInHierarchy),
    cc.director.addPersistRootNode(a),
    cc.director.addPersistRootNode(c),
    (window_cce.foregroundNode = a),
    (window_cce.backgroundNode = c),
    new scene_facade_manager_1.SceneFacadeManager());

  await (window_cce.SceneFacadeManager = a).init();
};
