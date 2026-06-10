Object.defineProperty(exports, "__esModule", { value: true });
exports.EffectManager = undefined;
const cc_1 = require("cc");
const message_1 = require("./message");
class EffectManager {
  _uuidSet = new Set();
  async init() {
    var e = (await cce.Ipc.request("query-effects")).map((e) =>
      this.registerEffect(e)
    );
    await Promise.all(e);
  }
  registerEffects(e) {
    e.forEach((e) => {
      this.registerEffect(e);
    });
  }
  registerEffect(r) {
    return new Promise((s) => {
      cc_1.assetManager.loadAny(r, (e, t) => {
        if (e) {
          console.error(e);
          return s();
        }
        this._uuidSet.add(r);
        message_1.messageManager.broadcast("scene:effect-update", r);
        s();
      });
    });
  }
  removeEffect(e) {
    if (this._uuidSet.has(e)) {
      if (cc_1.EffectAsset && cc_1.EffectAsset.remove) {
        this._uuidSet.delete(e);
        cc_1.EffectAsset.remove(e);
        message_1.messageManager.broadcast("scene:effect-update", e);
        return true;
      }
      console.warn("cannot call method cc.EffectAsset.remove");
    }
    return false;
  }
  removeEffects(e) {
    e.map((e) => {
      this.removeEffect(e);
    });
  }
  updateEffect(e) {
    this.removeEffect(e);
    this.registerEffect(e);
  }
}
exports.EffectManager = EffectManager;
exports.default = new EffectManager();
