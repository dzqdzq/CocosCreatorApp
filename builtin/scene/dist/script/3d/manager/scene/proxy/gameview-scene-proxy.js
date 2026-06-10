var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
const scene_proxy_1 = __importDefault(require("./scene-proxy"));
const utils_1 = __importDefault(require("../utils"));
const cc_1 = require("cc");
const index_1 = __importDefault(require("../../preview-play/index"));
class GameviewSceneProxy extends scene_proxy_1.default {
  get name() {
    return "gameview";
  }
  async open(e) {
    return false;
  }
  async close() {
    return true;
  }
  async reload() {
    return true;
  }
  async softReload(e = null) {
    try {
      this._sceneMgr.sendSceneCloseMsg(cc_1.director.getScene());

      await utils_1.default.loadSceneByJson(
        e || index_1.default.startSceneJson
      );

      var r = cc_1.director.getScene();
      this._sceneMgr.sendSceneOpenMsg(r, r.uuid, r);
      return true;
    } catch (e) {
      console.error("Failed to refresh the current scene");
      console.error(e);
      return false;
    }
  }
  async staging() {
    return true;
  }
  async restore(e = 0) {
    return false;
  }
  queryCurrentSceneUuid() {
    return cc_1.director.getScene()?.uuid || "";
  }
  getRootNode() {
    return this._sceneMgr.rootNode;
  }
}
exports.default = GameviewSceneProxy;
