var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
async function nativeSceneAvailable() {
  var e = (await Editor.Message.request("engine", "query-engine-info"))
    .typescript.path;

  var e = path_1.default.join(e, "bin/.editor");
  var e = path_1.default.join(e, "EngineAddon.node");
  return fs_1.default.existsSync(e);
}
class Env {
  _inited = false;
  _isNative = false;
  async useNativeScene(e) {
    if (!this._inited) {
      this._isNative = await Editor.Profile.getConfig(
        "scene",
        "scene.native-engine",
        "global"
      );

      this._inited = true;
    }

    return (
      !!this._isNative &&
      (e?.checkAvailable !== false ? nativeSceneAvailable() : this._isNative)
    );
  }
}
const EnvUtil = new Env();
exports.default = EnvUtil;
