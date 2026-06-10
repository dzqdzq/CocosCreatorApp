var Helper_1;

var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, r, i = r) => {
        Object.defineProperty(e, i, {
          enumerable: true,
          get() {
            return t[r];
          },
        });
      }
    : (e, t, r, i) => {
        e[(i = i === undefined ? r : i)] = t[r];
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

var __decorate =
  (this && this.__decorate) ||
  function (e, t, r, i) {
    var a;
    var arguments_length = arguments.length;

    var c =
      arguments_length < 3
        ? t
        : i === null
        ? (i = Object.getOwnPropertyDescriptor(t, r))
        : i;

    if (typeof Reflect == "object" && typeof Reflect.decorate == "function") {
      c = Reflect.decorate(e, t, r, i);
    } else {
      for (var n = e.length - 1; n >= 0; n--) {
        if ((a = e[n])) {
          c =
            (arguments_length < 3
              ? a(c)
              : arguments_length > 3
              ? a(t, r, c)
              : a(t, r)) || c;
        }
      }
    }

    if (arguments_length > 3 && c) {
      Object.defineProperty(t, r, c);
    }

    return c;
  };

var __importStar =
  (this && this.__importStar) ||
  ((e) => {
    if (e && e.__esModule) {
      return e;
    }
    var t = {};
    if (e != null) {
      for (var r in e) {
        if (r !== "default" && Object.prototype.hasOwnProperty.call(e, r)) {
          __createBinding(t, e, r);
        }
      }
    }
    __setModuleDefault(t, e);
    return t;
  });

Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateAnimationClip330 = undefined;
const migration_utils_1 = require("../utils/migration-utils");
const cc = __importStar(require("cc"));
const archive_space_1 = require("./archive-space");
const animation_clip_migration_1 = require("cc/editor/animation-clip-migration");
let Helper = (Helper_1 = class {
  constructor() {
    this.duration = 0;
    this._keys = [];
    this._curves = [];
    this._commonTargets = [];
  }
  static createFromSerializedLegacyClip(e) {
    const t = new ArrayBuffer(0);
    var r = null != (r = e.duration) ? r : 0;

    var i = (null != (i = e._keys) ? i : []).map((e) =>
      decodeMaybeCompactValueTypeArray(e, t)
    );

    var a = null != (a = e._curves) ? a : [];

    var e =
      (a.forEach((e) => {
        decodeMaybeCompactValueTypeArray(e.data.values, t);
      }),
      null != (e = e._commonTargets) ? e : []);

    var o = new migration_utils_1.Archive();
    var c = o.addTypedObject(cc.js.getClassName(Helper_1));

    c.duration = r;
    c._keys = i;
    c._curves = a;
    c._commonTargets = e;
    var n = cc.deserialize.Details.pool.get();

    var r = o.get(c);
    var i = cc.deserialize(r, n, undefined);
    var s = n.uuidList.length;
    for (let e = 0; e < s; ++e) {
      var l = n.uuidList[e];
      var _ = n.uuidObjList[e];
      var u = n.uuidPropList[e];
      var d = n.uuidTypeList[e];
      var d = new (null != (d = cc.js.getClassById(d)) ? d : cc.Asset)();
      d._uuid = String(l);
      _[u] = d;
    }
    return i;
  }
  toLegacyData() {
    var e = new animation_clip_migration_1.AnimationClipLegacyData(
      this.duration
    );
    e.keys = this._keys;
    e.curves = this._curves;
    e.commonTargets = this._commonTargets;
    return e;
  }
});
async function migrateAnimationClip330(e) {
  e.visitTypedObject(
    archive_space_1.ArchiveSpace.ANIMATION_CLIP_TYPE_NAME,
    (e) => {
      var t = Helper.createFromSerializedLegacyClip(e).toLegacyData();
      var e_events = e.events;
      delete e._keys;
      delete e._curves;
      delete e._commonTargets;
      delete e._stepness;
      delete e.events;
      var t = t.toTracks();

      var t = new migration_utils_1.Archive(
        EditorExtends.serialize(t, { stringify: false })
      );

      e._tracks = t.root;
      e._events = e_events;
      e._exoticAnimation = null;
    }
  );
}
function decodeMaybeCompactValueTypeArray(e, t) {
  return Array.isArray(e)
    ? e
    : cc.deserialize(e, undefined, undefined).decompress(t);
}
__decorate([cc._decorator.property], Helper.prototype, "duration", undefined);
__decorate([cc._decorator.property], Helper.prototype, "_keys", undefined);
__decorate([cc._decorator.property], Helper.prototype, "_curves", undefined);

__decorate(
  [cc._decorator.property],
  Helper.prototype,
  "_commonTargets",
  undefined
);

Helper = Helper_1 = __decorate(
  [cc._decorator.ccclass("cc._internal.migrate-animation_clip-3-3-0.Helper")],
  Helper
);

exports.migrateAnimationClip330 = migrateAnimationClip330;
