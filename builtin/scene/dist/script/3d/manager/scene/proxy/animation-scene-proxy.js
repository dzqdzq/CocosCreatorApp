var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, r, o = r) => {
        var n = Object.getOwnPropertyDescriptor(t, r);

        if (
          !n ||
          (!("get" in n) ? !n.writable && !n.configurable : t.__esModule)
        ) {
          n = {
            enumerable: true,
            get() {
              return t[r];
            },
          };
        }

        Object.defineProperty(e, o, n);
      }
    : (e, t, r, o) => {
        e[(o = o === undefined ? r : o)] = t[r];
      });

var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? (e, t) => {
        Object.defineProperty(e, "default", { enumerable: true, value: t });
      }
    : (e, t) => {
        e.default = t;
      });

var __importStar =
  (this && this.__importStar) ||
  (() => {
    var n = (e) =>
      (n =
        Object.getOwnPropertyNames ||
        ((e) => {
          var t;
          var r = [];
          for (t in e) {
            if (Object.prototype.hasOwnProperty.call(e, t)) {
              r[r.length] = t;
            }
          }
          return r;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var t = {};
      if (e != null) {
        for (var r = n(e), o = 0; o < r.length; o++) {
          if (r[o] !== "default") {
            __createBinding(t, e, r[o]);
          }
        }
      }
      __setModuleDefault(t, e);
      return t;
    };
  })();

var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));

Object.defineProperty(exports, "__esModule", { value: true });
const scene_proxy_1 = __importDefault(require("./scene-proxy"));
const dumpEncode = __importStar(require("../../../../export/dump/encode"));
const dumpDecode = __importStar(require("../../../../export/dump/decode"));
const utils_1 = __importDefault(require("../utils"));
const cc_1 = require("cc");
const animation_1 = __importDefault(require("../../animation"));
const message_1 = require("../../message");
const event_enum_1 = require("../../../../public/event-enum");
const animCompRE = /Animation/;
class AnimationSceneProxy extends scene_proxy_1.default {
  root = "";
  rootNodeDump = null;
  materialsDump = null;
  duplicateMatUuids = [];
  get name() {
    return "animation";
  }
  constructor(e, t) {
    super(e, t);
    this.root = "";
    this.rootNodeDump = null;
    this.materialsDump = null;
    this.duplicateMatUuids = [];
  }
  getType(e, t) {
    let r = null;
    return (r = cc_1.CCClass._isCCClass(e.constructor)
      ? require("../../animation/utils").utils.getCCClassAnimablePropType(e, t)
      : typeof e[t]);
  }
  async open(e) {
    this.root = e;
    this.rootNodeDump = null;
    var t = cce.Node.query(this.root);
    return t
      ? (t.walk((e) => {
          e.components.forEach((e) => {
            if (e instanceof cc_1.ParticleSystem2D) {
              e.onFocusInEditor();
            }
          });
        }),
        this._sceneMgr.emit("animation-start", e),
        message_1.messageManager.broadcast("scene:animation-start", e),
        super.open(e),
        Promise.resolve(true))
      : Promise.resolve(false);
  }
  async checkClose() {
    return animation_1.default.saveCheck();
  }
  async close() {
    var e = cce.Node.query(this.root);
    return (
      !!e &&
      (animation_1.default.restoreData(),
      (this.rootNodeDump = dumpEncode.encodeNode(e)),
      animation_1.default.record(this.root, false),
      (this.root = ""),
      this._sceneMgr.emit("animation-end"),
      message_1.messageManager.broadcast("scene:animation-end"),
      super.close(),
      true)
    );
  }
  async reload() {
    return Promise.resolve(true);
  }
  async softReload() {
    var e = cc_1.director.getScene();
    if (!e) {
      return false;
    }
    if (this._isSoftReloading) {
      return !(this._needOneMoreReload = true);
    }
    try {
      this._isSoftReloading = true;
      var t = this.storePrefabUUID(e);
      var r = new cc.SceneAsset();
      r.scene = e;
      var o = cce.Utils.serialize(r);
      this._sceneMgr.sendSceneCloseMsg(e);
      await utils_1.default.loadSceneByJson(o);
      this.restorePrefabUUID(cc_1.director.getScene(), t);
      var n = cc_1.director.getScene();

      this._sceneMgr.sendSceneOpenMsg(n, n.uuid, cce.Node.query(this.root));
      this._isSoftReloading = false;

      if (this._needOneMoreReload) {
        this._needOneMoreReload = false;
        this.softReload();
      }
    } catch (e) {
      console.error("Failed to refresh the current scene");
      console.error(e);
    }
    return true;
  }
  serialize() {
    return animation_1.default.getSerializedEditClip();
  }
  async queryDirty() {
    return animation_1.default.isDirty();
  }
  async save() {
    var e = await animation_1.default.save();

    if (e) {
      this._sceneFacade._undoMgr.save();
    }

    return e;
  }
  async patch() {
    if (!this.rootNodeDump) {
      return Promise.resolve(false);
    }
    var e = cce.Node.query(this.rootNodeDump.uuid.value);
    if (!e) {
      return Promise.resolve(false);
    }
    var t = e.getComponent("cc.Animation");
    let r = null;

    this.rootNodeDump.__comps__.some(
      (e) => !!animCompRE.test(e.cid) && ((r = e), true)
    );

    if (!t || !r) {
      return Promise.resolve(false);
    }

    if (!animation_1.default.isComponentDirty()) {
      return Promise.resolve(false);
    }
    for (const n in r.value) {
      if (n in r.value) {
        await dumpDecode.decodePatch(n, r.value[n], t);
      }
    }
    dumpDecode.decodeMountedRoot(t, r.mountedRoot);
    var o = e.components.indexOf(t);

    var o = {
      type: event_enum_1.NodeOperationType.SET_PROPERTY,
      propPath: "__comps__." + o,
      dumpImmediately: false,
    };

    cce.Node.emit("change", e, o);
    return Promise.resolve(true);
  }
  getRootNode() {
    return cc_1.director.getScene();
  }
}
exports.default = AnimationSceneProxy;
