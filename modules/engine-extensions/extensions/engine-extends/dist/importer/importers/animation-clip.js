var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, a, t, r = t) => {
        Object.defineProperty(e, r, {
          enumerable: true,
          get() {
            return a[t];
          },
        });
      }
    : (e, a, t, r) => {
        e[(r = r === undefined ? t : r)] = a[t];
      });

var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? (e, a) => {
        Object.defineProperty(e, "default", { enumerable: true, value: a });
      }
    : (e, a) => {
        e.default = a;
      });

var __importStar =
  (this && this.__importStar) ||
  ((e) => {
    if (e && e.__esModule) {
      return e;
    }
    var a = {};
    if (e != null) {
      for (var t in e) {
        if (t !== "default" && Object.prototype.hasOwnProperty.call(e, t)) {
          __createBinding(a, e, t);
        }
      }
    }
    __setModuleDefault(a, e);
    return a;
  });

var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));

Object.defineProperty(exports, "__esModule", { value: true });

exports.migrate_1_0_10 = undefined;
exports.migrate_1_0_8 = undefined;
exports.changeCCType = undefined;
exports.migrate_1_0_3 = undefined;
exports.AnimationImporter = undefined;

const asset_db_1 = require("@editor/asset-db");
const cc_1 = require("cc");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const migrate_animation_clip_3_3_0_1 = require("./migrates/migrate-animation-clip-3-3-0");
const migrates_1 = require("./scene/migrates");
const migration_utils_1 = require("./utils/migration-utils");
const serialize_library_1 = require("./utils/serialize-library");
const cc = __importStar(require("cc"));
const fs_extra_2 = __importDefault(require("fs-extra"));
const path_2 = __importDefault(require("path"));
const archive_space_1 = require("./migrates/archive-space");
const utils_1 = require("../utils");
class AnimationImporter extends asset_db_1.Importer {
  get version() {
    return "2.0.3";
  }
  get name() {
    return "animation-clip";
  }
  get assetType() {
    return "cc.AnimationClip";
  }
  get migrations() {
    return [
      { version: "1.0.2", migrate: migrates_1.migrateImageUuid },
      { version: "1.0.3", migrate: migrate_1_0_3 },
      {
        version: "1.0.4",
        async migrate(e) {
          await migrates_1.migrateNameToId(e, true);
        },
      },
      { version: "1.0.5", migrate: migrates_1.migrateNameToId },
      { version: "1.0.6", migrate: migrateType },
      { version: "1.0.7", migrate: migrateSharedMaterials },
      { version: "1.0.8", migrate: migrate_1_0_8 },
      { version: "1.0.10", migrate: migrate_1_0_10 },
      { version: "1.0.11", migrate: migrateComponentNames },
      {
        version: "2.0.0",
        migrate: async (e) => {
          var e = e.getSwapSpace();
          var a = new migration_utils_1.Archive(e.json);

          var a =
            (await migrate_animation_clip_3_3_0_1.migrateAnimationClip330(a),
            a.get());

          e.json = a;
        },
      },
    ];
  }
  get migrationHook() {
    return Object.assign(Object.assign({}, migrates_1.migrationHook), {
      async pre(a) {
        try {
          var e = path_2.default.join(a.temp, "migration-backup", "source");
          var t = path_2.default.join(a.temp, "migration-backup", "meta");
          await fs_extra_2.default.ensureDir(path_2.default.dirname(e));
          await fs_extra_2.default.copyFile(a.source, e);
          await fs_extra_2.default.ensureDir(path_2.default.dirname(t));
          await fs_extra_2.default.copyFile(a.source + ".meta", t);
        } catch (e) {
          console.error(
            `Error when attempt to save asset ${a.source} before migration.`
          );
        }
        return migrates_1.migrationHook.pre(a);
      },
      async post(e, a) {
        return migrates_1.migrationHook.post(e, a);
      },
    });
  }
  async force(e) {
    return e.userData.name !== e.basename;
  }
  async import(a) {
    var t;
    var a_userData = a.userData;
    try {
      var r = await fs_extra_1.readFile(a.source, "utf8");
      var i = JSON.parse(r);
      var s = cc.deserialize.Details.pool.get();
      var n = cc.deserialize(i, s, undefined);
      var o = s.uuidList.length;
      for (let a_userData = 0; a_userData < o; ++a_userData) {
        var _ = s.uuidList[a_userData];
        var c = s.uuidObjList[a_userData];
        var m = s.uuidPropList[a_userData];
        var u = s.uuidTypeList[a_userData];
        const a = new (null != (t = cc.js.getClassById(u)) ? t : cc.Asset)();
        a._uuid = String(_);
        c[m] = a;
      }
      n.name = path_1.basename(a.source, ".anim");
      a_userData.name = n.name;
      n.hash;

      var { extension, data } = serialize_library_1.serializeForLibrary(n);

      await a.saveToLibrary(extension, data);
      var g = utils_1.getDependUUIDList(r);
      a.setData("depends", g);
    } catch (e) {
      console.error(e);
      return false;
    }
    return true;
  }
}
exports.AnimationImporter = AnimationImporter;

const walkCCClass = (e, a, t) => {
  if (Array.isArray(e)) {
    e.forEach((e) => {
      walkCCClass(e, a, t);
    });
  } else if (e && typeof e == "object") {
    if (e.__type__ === a) {
      t(e);
    } else {
      for (const r of Object.values(e)) {
        walkCCClass(r, a, t);
      }
    }
  }
};

const walkCCClasses = (t, r) => {
  if (Array.isArray(t)) {
    t.forEach((e, a) => {
      t[a] = walkCCClasses(e, r);
    });
  } else if (t && typeof t == "object") {
    if (t.__type__ in r) {
      return r[t.__type__](t);
    }
    for (const e of Object.keys(t)) {
      t[e] = walkCCClasses(t[e], r);
    }
  }
  return t;
};

async function migrate_1_0_3(e) {
  e = e.getSwapSpace().json || (await fs_extra_1.readJSON(e.source));
  walkCCClass(e, cc.js.getClassName(cc.AnimationClip), (e) => {
    var { _curves, curveDatas } = e;

    if (
      Array.isArray(_curves) &&
      _curves.length !== 0 &&
      typeof curveDatas == "object" &&
      Object.keys(curveDatas).length !== 0
    ) {
      delete e._curves;
    }
  });
}
function changeCCType(e, a) {
  e.__type__ = a;
  return e;
}
async function migrate_1_0_8(e) {
  e = e.getSwapSpace().json || (await fs_extra_1.readJSON(e.source));
  walkCCClasses(e, {
    "cc.ComponentModifier": (e) =>
      changeCCType(e, cc_1.js.getClassName(cc_1.animation.ComponentPath)),
    "cc.HierachyModifier": (e) =>
      changeCCType(e, cc_1.js.getClassName(cc_1.animation.HierarchyPath)),
    "cc.UniformCurveValueAdapter": (e) =>
      changeCCType(e, cc_1.js.getClassName(cc_1.animation.UniformProxyFactory)),
  });
}
async function migrate_1_0_10(e) {
  var a = e.getSwapSpace();
  var e = a.json || (await fs_extra_1.readJSON(e.source));
  var e = new migration_utils_1.Archive(e);

  e.visitTypedObject(
    archive_space_1.ArchiveSpace.ANIMATION_CLIP_TYPE_NAME,
    (e) => {
      var a;

      if (e.curveDatas) {
        a = ((e) => {
          var a = [];
          for (const _ of Object.keys(e)) {
            var t = { __type__: "cc.animation.HierarchyPath", path: _ };
            var r = e[_];
            if (r.props) {
              for (const c of Object.keys(r.props)) {
                var i = r.props[c];
                a.push({ modifiers: [t, c], data: i });
              }
            }
            if (r.comps) {
              for (const m of Object.keys(r.comps)) {
                var s = {
                  __type__: "cc.animation.ComponentPath",
                  component: m,
                };

                var n = r.comps[m];
                for (const u of Object.keys(n)) {
                  var o = n[u];
                  a.push({ modifiers: [t, s, u], data: o });
                }
              }
            }
          }
          return a;
        })(e.curveDatas);

        e._curves = a;
        delete e.curveDatas;
      }
    }
  );

  a.json = e.get();
}
async function migrateComponentNames(e) {
  var a = e.getSwapSpace().json || (await fs_extra_1.readJSON(e.source));
  for (let e = 0; e < a.length; e++) {
    var t = a[e];
    var r = migrates_1._renameMap[t.component];

    if (r) {
      t.component = r;
    }
  }
}
async function migrateType(e) {
  e = e.getSwapSpace().json || (await fs_extra_1.readJSON(e.source));

  if (e.__type__ !== "cc.AnimationClip") {
    e.__type__ = "cc.AnimationClip";
  }
}
async function migrateSharedMaterials(e) {
  var e = e.getSwapSpace().json || (await fs_extra_1.readJSON(e.source));

  if (
    e &&
    (e = e[0]) &&
    e.__type__ === cc_1.js.getClassName(cc_1.AnimationClip) &&
    (e = e._curves) &&
    e.length > 0
  ) {
    e.forEach((e) => {
      if (
        e &&
        (e = e.modifiers) &&
        e.length >= 2 &&
        e[1] === "sharedMaterials"
      ) {
        e[1] = "materials";
      }
    });
  }
}
exports.migrate_1_0_3 = migrate_1_0_3;
exports.changeCCType = changeCCType;
exports.migrate_1_0_8 = migrate_1_0_8;
exports.migrate_1_0_10 = migrate_1_0_10;
