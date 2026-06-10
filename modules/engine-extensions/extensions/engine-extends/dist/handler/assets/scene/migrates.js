var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, a, t, i = t) => {
        var r = Object.getOwnPropertyDescriptor(a, t);

        if (
          !r ||
          (!("get" in r) ? !r.writable && !r.configurable : a.__esModule)
        ) {
          r = {
            enumerable: true,
            get() {
              return a[t];
            },
          };
        }

        Object.defineProperty(e, i, r);
      }
    : (e, a, t, i) => {
        e[(i = i === undefined ? t : i)] = a[t];
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
  (() => {
    var r = (e) =>
      (r =
        Object.getOwnPropertyNames ||
        ((e) => {
          var a;
          var t = [];
          for (a in e) {
            if (Object.prototype.hasOwnProperty.call(e, a)) {
              t[t.length] = a;
            }
          }
          return t;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var a = {};
      if (e != null) {
        for (var t = r(e), i = 0; i < t.length; i++) {
          if (t[i] !== "default") {
            __createBinding(a, e, t[i]);
          }
        }
      }
      __setModuleDefault(a, e);
      return a;
    };
  })();

Object.defineProperty(exports, "__esModule", { value: true });
exports._renameMap = undefined;
exports.migrations = undefined;
exports.migrateImageUuid = migrateImageUuid;
exports.migrateAnimationName = migrateAnimationName;
exports.migrateNameToId = migrateNameToId;
exports.migrateDefaultLayer = migrateDefaultLayer;
exports.migrateSavePrefabInfo = migrateSavePrefabInfo;
exports.migrateSavePrefabInfoAgain = migrateSavePrefabInfoAgain;
exports.migrateWidgetComponent = migrateWidgetComponent;
exports.migrateUIPriority = migrateUIPriority;
exports.migrateSkybox = migrateSkybox;
exports.migrateParticleModule = migrateParticleModule;
exports.migrateParticleComponentModule = migrateParticleComponentModule;
exports.migrateScrollAndPageViewComponenetModule =
  migrateScrollAndPageViewComponenetModule;
exports.migrateShadow = migrateShadow;
exports.migrateUILayout = migrateUILayout;
exports.migratePrefabCompPrefabInfo = migratePrefabCompPrefabInfo;
exports.migrateShadowInfo = migrateShadowInfo;
exports.migrateShadowDepthBias = migrateShadowDepthBias;
exports.migratePrivateNode = migratePrivateNode;
exports.migrateShadowAutoAdapt = migrateShadowAutoAdapt;
exports.migrateHDRData = migrateHDRData;
exports.migrateFogData = migrateFogData;
exports.migrateSkyLightingTypeData = migrateSkyLightingTypeData;
exports.migrateLightBakeable = migrateLightBakeable;
exports.migrateShadowsData = migrateShadowsData;
exports.migratePunctualLightLuminance = migratePunctualLightLuminance;
exports.migrateCSMData = migrateCSMData;
exports.migrateMaskImageStencil = migrateMaskImageStencil;
exports.migrateMaskImageStencilSizeMode = migrateMaskImageStencilSizeMode;
exports.migrateLabelOutlineAndShadow = migrateLabelOutlineAndShadow;
exports.migrateBakeSettings = migrateBakeSettings;
exports.migrateBloomThreshold = migrateBloomThreshold;
exports.migratePrefabParentNull = migratePrefabParentNull;
exports.migrateFXAA = migrateFXAA;

const { queryAsset } = require("@editor/asset-db");

const { nameToId } = require("@editor/asset-db/libs/utils");

const cc = __importStar(require("cc"));

const {
  readJSON,
  writeJSONSync,
  writeFileSync,
  existsSync,
  readJsonSync,
  copyFile,
} = require("fs-extra");

const { join } = require("path");

const reader_manager_1 = require("../gltf/reader-manager");

const { walk, getComponent, walkAsync } = require("./utils");

const components_1 = require("../migrates/components");

const { beforeMigratePrefab, migratePrefab } = require("../migrates/prefab");

const migration_utils_1 = require("../utils/migration-utils");

const {
  migrateCurveRange330,
} = require("../migrates/migrate-curve-range-3-3-0");

const {
  migrateGeometryCurve330,
} = require("../migrates/migrate-geometry-curve-3-3-0");

const { migratePrefabInstanceRoots } = require("./migrate-prefab-1-1-34");

const { linearToSRGB } = require("../utils/equirect-cubemap-faces");

const clamp = Editor.Utils.Math.clamp;
async function migrateImageUuid(e) {
  e = e.getSwapSpace().json || (await readJSON(e.source));
  walk(e, (a) => {
    if ("__uuid__" in a) {
      var a_uuid = a.__uuid__;
      if (/@/.test(a_uuid)) {
        var i = a_uuid.split("@");
        let e;
        a_uuid = queryAsset(i[0]);
        if ((e = a_uuid ? a_uuid : e) && e.meta.importer === "image") {
          switch (e.meta.userData.type) {
            case "raw": {
              break;
            }
            case "texture": {
              i[1] = "texture";
              break;
            }
            case "normal map": {
              i[1] = "normalMap";
              break;
            }
            case "texture cube": {
              i[1] = "textureCube";
              break;
            }
            case "sprite-frame": {
              i[1] = "spriteFrame";
            }
          }
        }
        a.__uuid__ = i.join("@");
      }
    }
  });
}
exports.migrations = [
  { version: "1.0.4", migrate: migrateImageUuid },
  { version: "1.0.5", migrate: migrateSkinningRoot },
  { version: "1.0.6", migrate: migrateAnimationName },
  { version: "1.0.13", migrate: migrateVisibility },
  { version: "1.0.14", migrate: migrateClearFlags },
  {
    version: "1.0.15",
    migrate: async (e) => {
      await migrateNameToId(e, true);
    },
  },
  { version: "1.0.16", migrate: migrateDefaultLayer },
  { version: "1.0.18", migrate: migrateCameraVisibility },
  { version: "1.0.20", migrate: migrateNameToId },
  { version: "1.0.21", migrate: migrateWidgetComponent },
  { version: "1.0.22", migrate: migrateUIPriority },
  { version: "1.0.23", migrate: migrateSkybox },
  { version: "1.0.24", migrate: migrateSkinningMaterial },
  { version: "1.0.25", migrate: migrateBackSkinningMaterial },
  { version: "1.0.26", migrate: migrateSkinningMaterialForMeshSplit },
  { version: "1.0.27", migrate: migrateCapsuleColliderHeight },
  { version: "1.0.28", migrate: migrateParticleModule },
  { version: "1.0.29", migrate: migrateParticleComponentModule },
  { version: "1.0.31", migrate: async (e) => {} },
  { version: "1.0.32", migrate: migrateShadow },
  { version: "1.1.0", migrate: migrateComponentNames },
  { version: "1.1.20", migrate: migrateClickEventsNames },
  { version: "1.1.21", migrate: migrateCanvasAddWidget },
  { version: "1.1.22", migrate: migrateRigidBody },
  { version: "1.1.23", migrate: migrateUICustomMaterial },
  { version: "1.1.24", migrate: migrateVisibilityTypeError },
  { version: "1.1.25", migrate: migrateUILayout },
  { version: "1.1.26", migrate: migrateCanvasCamera },
  {
    version: "1.1.27",
    migrate: async (e) => {
      var a = e.getSwapSpace();
      var t = a.json || (await readJSON(e.source));
      await migratePrefabCompPrefabInfo(e);
      await beforeMigratePrefab(e);
      await migratePrefab(e);

      if (t) {
        a.json = JSON.parse(JSON.stringify(t));
      }
    },
  },
  {
    version: "1.1.29",
    migrate: async (e) => {
      await migrateShadowInfo(e);
    },
  },
  { version: "1.1.30", migrate: migrateGeometryCurveCurveRange330 },
  {
    version: "1.1.31",
    migrate: async (e) => {
      await migrateShadowDepthBias(e);
    },
  },
  {
    version: "1.1.32",
    migrate: async (e) => {
      await migratePrivateNode(e);
    },
  },
  {
    version: "1.1.33",
    migrate: async (e) => {
      await migrateShadowAutoAdapt(e);
    },
  },
  {
    version: "1.1.34",
    migrate: async (e) => {
      await migratePrefabInstanceRoots(e);
    },
  },
  {
    version: "1.1.35",
    migrate: async (e) => {
      await migrateHDRData(e);
      await migrateFogData(e);
    },
  },
  {
    version: "1.1.36",
    migrate: async (e) => {
      await migrateSkyLightingTypeData(e);
    },
  },
  {
    version: "1.1.37",
    migrate: async (e) => {
      await migrateShadowsData(e);
    },
  },
  {
    version: "1.1.38",
    migrate: async (e) => {
      await migratePunctualLightLuminance(e);
    },
  },
  {
    version: "1.1.39",
    migrate: async (e) => {
      await migrateCSMData(e);
    },
  },
  {
    version: "1.1.40",
    migrate: async (e) => {
      await migrateMaskImageStencil(e);
    },
  },
  {
    version: "1.1.41",
    migrate: async (e) => {
      await migrateLightBakeable(e);
    },
  },
  {
    version: "1.1.42",
    migrate: async (e) => {
      await migrateBakeSettings(e);
    },
  },
  { version: "1.1.43", migrate: async (e) => {} },
  {
    version: "1.1.46",
    migrate: async (e) => {
      await migratePrefabParentNull(e);
    },
  },
  {
    version: "1.1.47",
    migrate: async (e) => {
      await migrateFXAA(e);
    },
  },
  {
    version: "1.1.48",
    migrate: async (e) => {
      await migrateMaskImageStencilSizeMode(e);
    },
  },
  {
    version: "1.1.50",
    migrate: async (e) => {
      await migrateLabelOutlineAndShadow(e);
      await migrateBloomThreshold(e);
    },
  },
];
const animationRE = /AnimationComponent/i;
const skinningRE = /SkinningModelComponent/i;
async function migrateSkinningRoot(e) {
  var a = e.getSwapSpace().json || (await readJSON(e.source));
  for (const r of a) {
    if (skinningRE.test(r.__type__)) {
      var t = r._skinningRoot && r._skinningRoot.__id__;
      if (!getComponent(a, t, animationRE)) {
        let e = r.node.__id__;

        while (e === r.node.__id__ || !getComponent(a, e, animationRE)) {
          var i = a[e]._parent;
          e = (i && i.__id__) || null;
        }

        if (e !== null) {
          r._skinningRoot = { __id__: e };
        }
      }
    }
  }
  writeJSONSync(e.source, a, { spaces: 2 });
}
async function migrateAnimationName(r) {
  var e = r.getSwapSpace().json || (await readJSON(r.source));

  await walkAsync(e, async (a) => {
    if ("__uuid__" in a) {
      var a_uuid = a.__uuid__;
      if (/@/.test(a_uuid)) {
        const i = a_uuid.split("@");
        let e;
        a_uuid = queryAsset(i[0]);

        if ((e = a_uuid ? a_uuid : e)) {
          r._assetDB.taskManager.pause(r.task);
          await e.waitInit();
          r._assetDB.taskManager.resume(r.task);

          Object.keys(e.subAssets).some((e) => {
            var a = e.replace(/[ <>:'#\/\\|?*\x00-\x1F]/g, "-");
            if (i[1] === a) {
              i[1] = e;
              return true;
            }
          });
        }

        a.__uuid__ = i.join("@");
      }
    }
  });

  writeJSONSync(r.source, e, { spaces: 2 });
}
const MissingClass = EditorExtends.MissingReporter.classInstance;
function classFinder(e, a, t, i) {
  e = MissingClass.classFinder(e, a, t, i);
  return e || cc.MissingScript;
}
async function migrateNormalizeScene(e) {
  var a;
  var t;

  if (e.extname === ".scene") {
    a = e.getSwapSpace().json || (await readJSON(e.source));
    t = cc.deserialize.Details.pool.get();
    MissingClass.hasMissingClass = false;

    (a = cc.deserialize(a, t, {
      createAssetRefs: true,
      ignoreEditorOnly: false,
      classFinder,
    })) instanceof cc.SceneAsset &&
      null !== (t = a.scene) &&
      (t._lpos && (t._lpos.x = t._lpos.y = t._lpos.z = 0),
      t._lscale && (t._lscale.x = t._lscale.y = t._lscale.z = 1),
      t._lrot && ((t._lrot.x = t._lrot.y = t._lrot.z = 0), (t._lrot.w = 1)),
      t._euler && (t._euler.x = t._euler.y = t._euler.z = 0),
      t._components) &&
      (t._components = []);

    writeFileSync(e.source, EditorExtends.serialize(a));
    MissingClass.reset();
  }
}
classFinder.onDereferenced = MissingClass.classFinder.onDereferenced;
const cameraRE = /CameraComponent/i;
async function migrateVisibility(e) {
  var a;
  var t = e.getSwapSpace().json || (await readJSON(e.source));
  for (const i of t) {
    if (cameraRE.test(i.__type__)) {
      i._visibility = 1619001344;
    }

    if (i._visFlags !== undefined) {
      i._visFlags &= ~(1 << 30);
    }

    if (i.node) {
      2 & (a = t[i.node.__id__]._layer) &&
        ((t[i.node.__id__]._layer &= -3), (t[i.node.__id__]._layer |= 1 << 20));

      4 & a &&
        ((t[i.node.__id__]._layer &= -5), (t[i.node.__id__]._layer |= 1 << 21));

      8 & a &&
        ((t[i.node.__id__]._layer &= -9), (t[i.node.__id__]._layer |= 1 << 22));

      16 & a &&
        ((t[i.node.__id__]._layer &= -17),
        (t[i.node.__id__]._layer |= 1 << 23));

      t[i.node.__id__]._layer |= 1 << 30;
    }
  }
}
async function migrateClearFlags(e) {
  e = e.getSwapSpace().json || (await readJSON(e.source));
  const a = /SkyboxInfo/i;
  var t = e.find((e) => a.test(e.__type__));
  if (t && t._enabled) {
    for (const i of e) {
      if (cameraRE.test(i.__type__)) {
        i._clearFlags = cc.Camera.ClearFlag.SKYBOX;
      }
    }
  }
}
async function migrateNameToId(e, i) {
  e = e.getSwapSpace().json || (await readJSON(e.source));
  walk(e, (e) => {
    var e_uuid = e.__uuid__;
    if (/@/.test(e_uuid)) {
      var t = e_uuid.split("@");
      if (!(t.length <= 1)) {
        for (let e = 1; e < t.length; e++) {
          t[e] = nameToId(t[e]);
        }
        e_uuid = t.join("@");

        if (i === true || queryAsset(e_uuid)) {
          e.__uuid__ = e_uuid;
        }
      }
    }
  });
}
async function migrateDefaultLayer(e) {
  var a = e.getSwapSpace().json || (await readJSON(e.source));
  for (const t of a) {
    if (t.node && a[t.node.__id__]._layer === 1073741825) {
      a[t.node.__id__]._layer = 1073741824;
    }
  }
}
async function migrateSavePrefabInfo(t) {
  if (t.extname === ".prefab") {
    var i;
    var r = t.getSwapSpace();
    var t = r.json || (await readJSON(t.source));
    let e = false;
    let a = false;
    for (const o of t) {
      if (o.__type__.startsWith("cc.Scene")) {
        e = true;
      }

      if (o.__type__.startsWith("cc.PrefabInfo")) {
        a = true;
      }
    }

    if (e || !a) {
      i = cc.deserialize.Details.pool.get();
      MissingClass.hasMissingClass = false;

      (t = cc.deserialize(t, i, {
        createAssetRefs: true,
        ignoreEditorOnly: false,
        classFinder,
      })).data.parent = null;

      (function a(e, t) {
        const i = e.parent && e.parent._prefab;
        const r = new cc.Prefab._utils.PrefabInfo();
        r.asset = t || i?.asset;
        r.root = (i && i.root) || e;
        r.fileId = e._prefab ? e._prefab.fileId : e.uuid;
        e._prefab = r;

        if (Array.isArray(e.children)) {
          e.children.forEach((e) => {
            if (e.parent && e.parent._prefab) {
              a(e, null);
            }
          });
        }
      })(t.data, t);

      r.json = JSON.parse(EditorExtends.serialize(t));
      MissingClass.reset();
    }
  }
}
function migrateSavePrefabInfoAgain(e) {
  migrateSavePrefabInfo(e);
}
async function migrateCameraVisibility(e) {
  (e.getSwapSpace().json || (await readJSON(e.source))).forEach((e) => {
    if (e.__type__ === "cc.CameraComponent") {
      if (e._visibility === 1619001344 || e._visibility === 1610612736) {
        e._visibility = 1822425087;
      }
    } else if (e.__type__ === "cc.Node" || e.__type__ === "cc.Scene") {
      if (e._layer === 1) {
        e._layer = 1073741824;
      }
    }
  });
}
async function migrateWidgetComponent(e) {
  for (const a of e.getSwapSpace().json || (await readJSON(e.source))) {
    if (a.__type__ === "cc.WidgetComponent") {
      a._isAbsLeft || a._left === 0 || (a._left /= 100);
      a._isAbsRight || a._right === 0 || (a._right /= 100);
      a._isAbsTop || a._top === 0 || (a._top /= 100);
      a._isAbsBottom || a._bottom === 0 || (a._bottom /= 100);

      a._isAbsHorizontalCenter ||
        a._horizontalCenter === 0 ||
        (a._horizontalCenter /= 100);

      a._isAbsVerticalCenter ||
        a._verticalCenter === 0 ||
        (a._verticalCenter /= 100);
    }
  }
}
async function migrateUIPriority(e) {
  var a = e.getSwapSpace().json || (await readJSON(e.source));
  for (const r of a) {
    if (
      r._priority !== undefined &&
      r.__type__ !== "cc.UITransformComponent" &&
      r.__type__ !== "cc.CanvasComponent"
    ) {
      var t = a[r.node.__id__];
      for (let e = 0; e < t._components.length; e++) {
        var i = a[t._components[e].__id__];

        if (i.__type__ === "cc.UITransformComponent") {
          i._priority = r._priority;
          delete r._priority;
        }
      }
    }
  }
}
async function migrateSkybox(e) {
  for (const a of e.getSwapSpace().json || (await readJSON(e.source))) {
    if (a.__type__ === "cc.SceneGlobals" && a.skybox) {
      a._skybox = a.skybox;
      delete a.skybox;
    }
  }
}
const skinningMaterials = new Set();
async function migrateSkinningMaterial(e) {
  var a;
  var t;
  var i = e.getSwapSpace().json || (await readJSON(e.source));
  for (const c of i) {
    if (c._materials && c.__type__ === "cc.SkinningModelComponent") {
      for (const l of c._materials) {
        var r;
        var o = l && l.__uuid__;
        var _ = o && queryAsset(o);
        if (_ && !skinningMaterials.has(o)) {
          e._assetDB.taskManager.pause(e.task);
          await _.waitInit();
          e._assetDB.taskManager.resume(e.task);

          if (existsSync(_.source)) {
            skinningMaterials.add(o);
            var n = await readJSON(_.source);
            var s = n._defines.length || 1;
            for (let a = 0; a < s; a++) {
              let e = n._defines[a];

              if (!(e = e || (n._defines[0] = {})).USE_SKINNING) {
                e.USE_SKINNING = true;
              }
            }
            writeJSONSync(_.source, n, { spaces: 2 });
          } else {
            if (o[o.length - 6] === "@" && !_._name.includes("-skinning")) {
              r = nameToId(r.slice(0, r.indexOf(".")) + "-skinning.material");

              _.parent &&
                _.parent.subAssets[r] &&
                (l.__uuid__ = o.slice(0, -6) + "@" + r);
            }
          }
        }
      }
    }
  }
  for (const d of i) {
    if (d._materials && d.__type__ !== "cc.SkinningModelComponent") {
      for (const p of d._materials) {
        if (p && ((a = p.__uuid__), skinningMaterials.has(a))) {
          t = i[d.node.__id__].name;

          console.warn(
            `skinning material '${a}' used on non-skinning model component on node '${t}'`
          );
        }
      }
    }
  }
}
async function migrateBackSkinningMaterial(e) {
  for (const n of e.getSwapSpace().json || (await readJSON(e.source))) {
    if (n._materials && n.__type__ === "cc.SkinningModelComponent") {
      for (const s of n._materials) {
        var a = s && s.__uuid__;
        if (a[a.length - 6] === "@") {
          var t = a.slice(0, a.length - 6);
          var i = queryAsset(t);
          if (i) {
            e._assetDB.taskManager.pause(e.task);
            await i.waitInit();
            e._assetDB.taskManager.resume(e.task);
            var r = a.slice(a.length - 5);
            for (const c in i.subAssets) {
              var o = i.subAssets[c];
              var _ = (o && o._name) || "";
              if (
                nameToId(_.slice(0, _.indexOf(".")) + "-skinning.material") ===
                r
              ) {
                s.__uuid__ = o.uuid;
                break;
              }
            }
          }
        }
      }
    }
  }
}
async function migrateSkinningMaterialForMeshSplit(e) {
  for (const n of e.getSwapSpace().json || (await readJSON(e.source))) {
    if (n.__type__ === "cc.SkinningModelComponent") {
      var n_materials = n._materials;
      if (n._mesh) {
        var t = n._mesh.__uuid__;
        var i = t.split("@")[0];
        var i = queryAsset(i);
        if (i) {
          e._assetDB.taskManager.pause(e.task);
          await i.waitInit();
          e._assetDB.taskManager.resume(e.task);
          i = queryAsset(t);
          if (i) {
            t = i.library + ".json";
            if (existsSync(t)) {
              const s = readJsonSync(t)._struct;
              var r = s.primitives.length;
              const n_materials_length = n_materials.length;
              if (n_materials_length < r) {
                t = await reader_manager_1.glTfReaderManager.getOrCreate(
                  i.parent
                );
                let e = t.processedMeshes.find((i) =>
                  s.jointMaps?.every((e, t) =>
                    e.every((e, a) => i.jointMaps && i.jointMaps[t][a] === e)
                  )
                );

                var o =
                  ((e =
                    e ||
                    t.processedMeshes.find((t) =>
                      s.vertexBundles.every(
                        (e, a) => e.view.count === t.geometries[a]?.vertexCount
                      )
                    )) &&
                    e.materialIndices) ||
                  Array(r)
                    .fill(0)
                    .map((e, a) => Math.min(a, n_materials_length - 1));

                var _ = n_materials.slice();
                for (let e = 0; e < r; e++) {
                  n_materials[e] = _[o[e]];
                }
              }
            }
          }
        }
      }
    }
  }
}
const ParticleModule = [
  "cc.ColorOvertimeModule",
  "cc.SizeOvertimeModule",
  "cc.RotationOvertimeModule",
  "cc.ForceOvertimeModule",
  "cc.LimitVelocityOvertimeModule",
  "cc.VelocityOvertimeModule",
  "cc.ShapeModule",
];
async function migrateParticleModule(e) {
  for (const a of e.getSwapSpace().json || (await readJSON(e.source))) {
    if (ParticleModule.includes(a.__type__) && a.enable !== undefined) {
      a._enable = a.enable;
    }
  }
}
const ParticleModuleName = [
  "colorOverLifetimeModule",
  "sizeOvertimeModule",
  "rotationOvertimeModule",
  "forceOvertimeModule",
  "limitVelocityOvertimeModule",
  "velocityOvertimeModule",
  "shapeModule",
  "trailModule",
  "textureAnimationModule",
];
async function migrateParticleComponentModule(e) {
  for (const t of e.getSwapSpace().json || (await readJSON(e.source))) {
    if (t.__type__ === "cc.ParticleSystemComponent") {
      ParticleModuleName.forEach((e) => {
        var a = "_" + e;
        t[a] = t[e];
        delete t[e];
      });
    }
  }
}
async function migrateScrollAndPageViewComponenetModule(e, a) {
  var t = e.getSwapSpace().json || (await readJSON(e.source));
  for (const o of t) {
    if (o.__type__ === a && o._content) {
      var i = t[o._content.__id__];
      if (i._components) {
        let a = null;
        for (let e = 0; e < i._components.length; ++e) {
          var r = i._components[e].__id__;
          if (t[r].__type__ === "cc.UITransformComponent") {
            a = r;
            break;
          }
        }
        o._content.__id__ = a;
      }
    }
  }
}
async function migrateCapsuleColliderHeight(e) {
  (e.getSwapSpace().json || (await readJSON(e.source))).forEach((a) => {
    if (a.__type__ === "cc.CapsuleColliderComponent") {
      let e = a._height - 2 * a._radius;

      if (e < 0) {
        e = 0;
      }

      a._cylinderHeight = e;
      delete a._height;
    }
  });
}
async function migrateShadow(e) {
  for (const a of e.getSwapSpace().json || (await readJSON(e.source))) {
    if (a.__type__ === "cc.SceneGlobals") {
      if (a.planarShadows) {
        a.shadows = a.planarShadows;
        delete a.planarShadows;
      }
    } else if (a.__type__ === "cc.PlanarShadowInfo") {
      a.__type__ = "cc.ShadowsInfo";
    }
  }
}
async function migrateComponentNames(r_type) {
  var i = r_type.getSwapSpace().json || (await readJSON(r_type.source));
  for (let t = 0; t < i.length; t++) {
    var r = i[t];
    let r_type = r.__type__;
    let a = exports._renameMap[r_type];

    if (a) {
      r.__type__ = a;
      r_type = r_type.substring(3);
      a = a.substring(3);
      r._name = r._name.replace(r_type, a);
    }
  }
}
async function migrateClickEventsNames(e) {
  var a = e.getSwapSpace().json || (await readJSON(e.source));
  for (let e = 0; e < a.length; e++) {
    var t;
    var i = a[e];

    if (
      i.__type__ === "cc.ClickEvent" &&
      ((t = i._componentId), (t = exports._renameMap[t]))
    ) {
      i._componentId = t;
    }
  }
}
exports._renameMap = {
  "cc.ModelComponent": "cc.MeshRenderer",
  "cc.SkinningModelComponent": "cc.SkinnedMeshRenderer",
  "cc.BatchedSkinningModelComponent": "cc.SkinnedMeshBatchRenderer",
  "cc.CameraComponent": "cc.Camera",
  "cc.AudioSourceComponent": "cc.AudioSource",
  "cc.DirectionalLightComponent": "cc.DirectionalLight",
  "cc.SphereLightComponent": "cc.SphereLight",
  "cc.SpotLightComponent": "cc.SpotLight",
  "cc.LightComponent": "cc.Light",
  "cc.AnimationComponent": "cc.Animation",
  "cc.SkeletalAnimationComponent": "cc.SkeletalAnimation",
  "cc.ParticleSystemComponent": "cc.ParticleSystem",
  "cc.BillboardComponent": "cc.Billboard",
  "cc.LineComponent": "cc.Line",
  "cc.RigidBodyComponent": "cc.RigidBody",
  "cc.BoxColliderComponent": "cc.BoxCollider",
  "cc.SphereColliderComponent": "cc.SphereCollider",
  "cc.CapsuleColliderComponent": "cc.CapsuleCollider",
  "cc.CylinderColliderComponent": "cc.CylinderCollider",
  "cc.ConeColliderComponent": "cc.ConeCollider",
  "cc.PlaneColliderComponent": "cc.PlaneCollider",
  "cc.SimplexColliderComponent": "cc.SimplexCollider",
  "cc.TerrainColliderComponent": "cc.TerrainCollider",
  "cc.MeshColliderComponent": "cc.MeshCollider",
  "cc.HingeConstraintComponent": "cc.HingeConstraint",
  "cc.PointToPointConstraintComponent": "cc.PointToPointConstraint",
  "cc.UITransformComponent": "cc.UITransform",
  "cc.UIModelComponent": "cc.UIMeshRenderer",
  "cc.CanvasComponent": "cc.Canvas",
  "cc.SpriteComponent": "cc.Sprite",
  "cc.LabelComponent": "cc.Label",
  "cc.GraphicsComponent": "cc.Graphics",
  "cc.WidgetComponent": "cc.Widget",
  "cc.ButtonComponent": "cc.Button",
  "cc.MaskComponent": "cc.Mask",
  "cc.ScrollViewComponent": "cc.ScrollView",
  "cc.ScrollBarComponent": "cc.ScrollBar",
  "cc.PageViewComponent": "cc.PageView",
  "cc.PageViewIndicatorComponent": "cc.PageViewIndicator",
  "cc.SliderComponent": "cc.Slider",
  "cc.ToggleContainerComponent": "cc.ToggleContainer",
  "cc.ToggleComponent": "cc.Toggle",
  "cc.RichTextComponent": "cc.RichText",
  "cc.LayoutComponent": "cc.Layout",
  "cc.UIStaticBatchComponent": "cc.UIStaticBatch",
  "cc.UIOpacityComponent": "cc.UIOpacity",
  "cc.LabelOutlineComponent": "cc.LabelOutline",
  "cc.ProgressBarComponent": "cc.ProgressBar",
  "cc.EditBoxComponent": "cc.EditBox",
  "cc.BlockInputEventsComponent": "cc.BlockInputEvents",
  "cc.UICoordinateTrackerComponent": "cc.UICoordinateTracker",
  "cc.SafeAreaComponent": "cc.SafeArea",
  "cc.ViewGroupComponent": "cc.ViewGroup",
  "cc.RenderComponent": "cc.UIRenderable",
};
const widgetRE = /^cc.Widget$/i;
async function migrateCanvasAddWidget(e) {
  var a;
  var t;
  var i = e.getSwapSpace().json || (await readJSON(e.source));
  try {
    for (const r of i) {
      if (
        r.__type__ === "cc.Canvas" &&
        !getComponent(i, r.node.__id__, widgetRE) &&
        (((a = JSON.parse(JSON.stringify(components_1.Widget))).node.__id__ =
          r.node.__id__),
        (a._alignFlags = 45),
        i.push(a),
        (t = i[r.node.__id__]))
      ) {
        t._components.push({ __id__: i.length - 1 });
      }
    }
  } catch (e) {
    console.error(e);
  }
}
const _maskMap = new Map();
let _times = 0;
async function migrateCanvasCamera(e) {
  var i = e.getSwapSpace().json || (await readJSON(e.source));
  let r = await Editor.Profile.getProject("project", "layer");
  r = r || [];

  if (_times === 0) {
    _times++;

    var a = join(__dirname, "../../../../static/migrate-scene-canvas.ts");

    var t = join(Editor.Project.path, "./assets/migrate-canvas.ts");
    await copyFile(a, t);
    Manager.AssetWorker.assets.refresh(t);
    for (const S of r) {
      _maskMap.set(S.value, S.name);
    }
  }

  try {
    for (const h of i) {
      if (h.__type__ === "cc.Camera") {
        for (let e = 20; e > 0; e--) {
          var o = 1 << e;

          if (!_maskMap.has(o) && h._visibility & o) {
            h._visibility ^= o;
          }
        }
      }
    }
    let a = 0;
    var _;
    let t = 0;
    for (const v of i) {
      if (v.__type__ === "cc.Canvas") {
        var n = 20 - ++a >= _maskMap.size;

        if (!n) {
          console.warn(
            `layer is not enough! Please check the scene! [${e.url}]`
          );
        }

        var s = i[v.node.__id__];

        for (let e = 20 - a; e >= 0; e--) {
          if (!_maskMap.has(1 << e) || !n) {
            t = 1 << e;
            _ = "canvas_" + e;
            s._layer = t;

            if (!r.find((e) => e.value === t)) {
              r.push({ name: _, value: t });
              r.sort((e, a) => e.value - a.value);
              await Editor.Profile.setProject("project", "layer", r);
            }

            break;
          }
        }
        if (v.node) {
          preChildSet(i, v.node, t);
          var i_length = i.length;
          var l = JSON.parse(getNodeStr());
          l[0]._name = "UICamera_" + i[v.node.__id__]._name;
          l[0]._parent = v.node;
          l[0]._layer = t;
          l[0]._id = Editor.Utils.UUID.generate();
          i[v.node.__id__]._children.push({ __id__: i_length });
          var d;
          var p = i[0] && i[0].__type__ === "cc.Prefab";

          if (p) {
            l[0]._prefab = {};
            l[0]._prefab.__id__ = i_length + 1;
          }

          l[0]._components[0].__id__ = p ? i_length + 2 : i_length + 1;
          let e = null;

          if (p) {
            d = JSON.parse(getPrefabInfoStr());
            (e = d[0]).root.__id__ = i_length;
            e.asset.__id__ = 0;
            e.fileId = Editor.Utils.UUID.generate();
          }

          var m;
          var g;
          var f;
          var u;
          var y = JSON.parse(getCameraStr());
          y[0].node.__id__ = i_length;
          y[0]._priority = getViewPriority(v, v._priority);
          y[0]._targetTexture = v._targetTexture;
          y[0]._clearFlags = v._clearFlag !== undefined ? v._clearFlag : 6;

          y[0]._color =
            v._color !== undefined
              ? JSON.parse(JSON.stringify(v._color))
              : { __type__: "cc.Color", r: 0, g: 0, b: 0, a: 255 };

          y[0]._visibility = 1 << 23;
          y[0]._visibility |= 1 << 25;
          y[0]._visibility |= t;
          y[0]._projection = 0;
          y[0]._far = 2000 /* 2e3 */;

          y[0]._rect = {
            __type__: "cc.Rect",
            x: 0,
            y: 0,
            width: 1,
            height: 1,
          };

          if (p) {
            y[0].__prefab = {};
            y[0].__prefab.__id__ = i_length + 3;
          }

          y[0]._id = Editor.Utils.UUID.generate();
          let a = null;

          if (p) {
            m = JSON.parse(getCompPrefabInfoStr());
            a = m[0];
            a.fileId = Editor.Utils.UUID.generate();
          }

          v._cameraComponent = {};
          v._cameraComponent.__id__ = p ? i_length + 2 : i_length + 1;
          v._alignCanvasWithScreen = true;
          i.push(l[0]);

          if (p) {
            i.push(e);
          }

          i.push(y[0]);

          if (p) {
            i.push(a);
          }

          if (!p && s && s._prefab) {
            g = JSON.parse(getSinglePrefabInfoStr());

            (f = i[s._prefab.__id__]) &&
              ((g.root.__id__ = f.root.__id__),
              (g.asset = { __uuid__: f.asset.__uuid__ }),
              (g.fileId = Editor.Utils.UUID.generate()));

            i.push(g);
            u = i.length - 1;
            l[0]._prefab = { __id__: u };
          }
        }
      }
    }
  } catch (e) {
    console.error(e);
  }
}
function preChildSet(e, a, t) {
  for (const i of e[a.__id__]._children) {
    e[i.__id__]._layer = t;
    preChildSet(e, i, t);
  }
}
function getViewPriority(e, a) {
  e = e._renderMode;
  return e === 0 || e === undefined ? a | (1 << 30) : a;
}
function getNodeStr() {
  return '[{"__type__": "cc.Node","_name": "Camera","_objFlags": 0,"_parent": {  "__id__": 1},"_children": [],"_active": true,"_components": [  {    "__id__": 10  }],"_prefab": null,"_lpos": {  "__type__": "cc.Vec3",  "x": 0,  "y": 0,  "z": 0},"_lrot": {  "__type__": "cc.Quat",  "x": 0,  "y": 0,  "z": 0,  "w": 1},"_lscale": {  "__type__": "cc.Vec3",  "x": 1,  "y": 1,  "z": 1},"_layer": 1073741824,"_euler": {  "__type__": "cc.Vec3",  "x": 0,  "y": 0,  "z": 0},"_id": "c9DMICJLFO5IeO07EPon7U"}]';
}
function getCameraStr() {
  return '[{"__type__": "cc.Camera","_name": "","_objFlags": 0,"node": {  "__id__": 0},"_enabled": true,"__prefab": null,"_projection": 1,"_priority": 0,"_fov": 45,"_fovAxis": 0,"_orthoHeight": 10,"_near": 1,"_far": 1000,"_color": {  "__type__": "cc.Color",  "r": 51,  "g": 51,  "b": 51,  "a": 255},"_depth": 1,"_stencil": 0,"_clearFlags": 7,"_rect": {  "__type__": "cc.Rect",  "x": 0,  "y": 0,  "width": 1,  "height": 1},"_aperture": 19,"_shutter": 7,"_iso": 0,"_screenScale": 1,"_visibility": 1822425087,"_targetTexture": null,"_id": "7dWQTpwS5LrIHnc1zAPUtf"}]';
}
function getPrefabInfoStr() {
  return '[{"__type__": "cc.PrefabInfo","root": {"__id__": 1 },"asset": {"__id__": 0 },"fileId": "deuJTKRANDsKzJ5LeyO/KM"}]';
}
function getSinglePrefabInfoStr() {
  return '{"__type__": "cc.PrefabInfo","root": {"__id__": 1 },"asset": {"__uuid__": 0 },"fileId": ""}';
}
function getCompPrefabInfoStr() {
  return '[{"__type__": "cc.CompPrefabInfo","fileId": "3cUBXFJqdHqabkl+K4SlQ6"}]';
}
async function migrateRigidBody(e) {
  (e.getSwapSpace().json || (await readJSON(e.source))).forEach((e) => {
    if (
      e.__type__ === "cc.RigidBody" &&
      (e._mass == 0 ? (e._type = 2) : e._isKinematic && (e._type = 4),
      e._fixedRotation)
    ) {
      e._angularFactor.x = 0;
      e._angularFactor.y = 0;
      e._angularFactor.z = 0;
    }
  });
}
async function migrateUICustomMaterial(e) {
  var a = e.getSwapSpace().json || (await readJSON(e.source));
  for (let e = 0; e < a.length; e++) {
    var t = a[e];

    if (
      t.__type__ === "cc.Sprite" ||
      t.__type__ === "cc.Label" ||
      t.__type__ === "cc.Graphics" ||
      t.__type__ === "cc.Mask" ||
      t.__type__ === "cc.UIStaticBatch"
    ) {
      t._materials &&
        t._materials.length &&
        (t._customMaterial = t._materials[0]);

      delete t._materials;
    }
  }
}
async function migrateVisibilityTypeError(e) {
  var a = e.getSwapSpace().json || (await readJSON(e.source));
  for (let e = 0; e < a.length; e++) {
    var t = a[e];

    if (t.__type__ === "cc.Camera") {
      t._visibility = +t._visibility;
    }
  }
}
async function migrateUILayout(e) {
  for (const a of e.getSwapSpace().json || (await readJSON(e.source))) {
    if (
      a.__type__ === "cc.Layout" &&
      (a._N$layoutType !== undefined &&
        ((a._layoutType = a._N$layoutType), delete a._N$layoutType),
      a._N$padding !== undefined)
    ) {
      a._paddingLeft =
        a._paddingRight =
        a._paddingTop =
        a._paddingBottom =
          a._N$padding;

      delete a._N$padding;
    }
  }
}
async function migratePrefabCompPrefabInfo(e) {
  var a = e.getSwapSpace().json || (await readJSON(e.source));
  var t = a[0] && a[0].__type__ === "cc.Prefab";
  for (const i of a) {
    if (i.__type__ === "cc.CompPrefabInfo ") {
      i.__type__ = "cc.CompPrefabInfo";
    } else if (
      t &&
      i.__type__ === "cc.PrefabInfo" &&
      i.root.__id__ === 1 &&
      (i.asset === null || i.asset.__uuid__ === e.uuid)
    ) {
      i.asset = { __id__: 0 };
    }
  }
}
async function migrateGeometryCurveCurveRange330(e) {
  var e = e.getSwapSpace();
  var a = new migration_utils_1.Archive(e.json);

  var a =
    (await migrateGeometryCurve330(a), await migrateCurveRange330(a), a.get());

  e.json = a;
}
async function migrateShadowInfo(e) {
  let a = 4096;
  let t = 8;
  for (const _ of e.getSwapSpace().json || (await readJSON(e.source))) {
    if (
      _.__type__ === "cc.ShadowsInfo" &&
      (_._shadowColor && (_._saturation = _._shadowColor.a / 255), _._size)
    ) {
      var _size = _._size;
      var r = cc.math.absMax(_size.x, _size.y);
      for (let e = 8; e < 12; e++) {
        var o = cc.math.bits.abs((1 << e) - r);

        if (o < a) {
          a = o;
          t = e;
        }
      }
      _._size = { __type__: "cc.Vec2", x: 1 << t, y: 1 << t };
    }
  }
}
async function migrateShadowDepthBias(e) {
  for (const a of e.getSwapSpace().json || (await readJSON(e.source))) {
    if (a.__type__ === "cc.ShadowsInfo" && a._bias) {
      a._bias = clamp(10000 /* 1e4 */ * a._bias, 0.01, 1);
    }
  }
}
async function migratePrivateNode(e) {
  var e = e.getSwapSpace().json || (await readJSON(e.source));
  var a = cc.CCObject.Flags.DontSave | cc.CCObject.Flags.HideInHierarchy;
  for (const t of e) {
    if (t.__type__ === "cc.PrivateNode") {
      t.__type__ = "cc.Node";
      t._objFlags |= a;
    }
  }
}
async function migrateShadowAutoAdapt(e) {
  var a;
  var t;
  for (const i of e.getSwapSpace().json || (await readJSON(e.source))) {
    if (i.__type__ === "cc.ShadowsInfo") {
      "_packing" in i && delete i._packing;
      "_linear" in i && delete i._linear;
      "_selfShadow" in i && delete i._selfShadow;
      "_aspect" in i && delete i._aspect;
      a = "_shadowDistance" in i;
      t = "_autoAdapt" in i;

      a
        ? ((i._firstSetCSM = false), t && delete i._autoAdapt)
        : t &&
          (i._autoAdapt === true
            ? ((i._fixedArea = false), (i._firstSetCSM = true))
            : (i._fixedArea = true),
          delete i._autoAdapt);
    }
  }
}
async function migrateHDRData(e) {
  var a;
  var t;
  var i;
  var r;
  var o;
  var _;
  var n;
  var s;
  var c = 1 / 38400;
  for (const l of e.getSwapSpace().json || (await readJSON(e.source))) {
    if (l.__type__ === "cc.SkyboxInfo") {
      a = "_useHDR" in l;
      t = "_envmapLDR" in l;
      i = "_diffuseMapLDR" in l;
      r = "_diffuseMapHDR" in l;
      _ = "_applyDiffuseMap" in l;
      o = "_isRGBE" in l;
      a || (l._useHDR = true);
      t || ((l._envmapLDR = l._envmap), (l._envmapHDR = l._envmap));
      i || (l._diffuseMapLDR = null);
      r || (l._diffuseMapHDR = null);
      o && delete l._isRGBE;
      _ || (l._applyDiffuseMap = false);
    }

    if (l.__type__ === "cc.AmbientInfo") {
      a = new cc.Color(l._skyColor);
      t = new cc.Color(l._groundAlbedo);
      i = "_skyColorLDR" in l;
      r = "_groundAlbedoLDR" in l;
      o = "_skyIllumLDR" in l;
      _ = "_skyIllumHDR" in l;

      i ||
        ((l._skyColor = { __type__: "cc.Vec4", x: 0, y: 0, z: 0, w: 0 }),
        (l._skyColor.x = a.x),
        (l._skyColor.y = a.y),
        (l._skyColor.z = a.z),
        (l._skyColor.w = 0.520833125),
        (l._skyColorLDR = l._skyColor),
        (l._skyColorHDR = l._skyColor));

      r ||
        ((l._groundAlbedo = { __type__: "cc.Vec4", x: 0, y: 0, z: 0, w: 0 }),
        (l._groundAlbedo.x = t.x),
        (l._groundAlbedo.y = t.y),
        (l._groundAlbedo.z = t.z),
        (l._groundAlbedo.w = t.w),
        (l._groundAlbedoLDR = l._groundAlbedo),
        (l._groundAlbedoHDR = l._groundAlbedo));

      o || (l._skyIllumLDR = l._skyIllum * c * 1.5);
      _ || (l._skyIllumHDR = l._skyIllum);
    }

    if (l.__type__ === "cc.DirectionalLight") {
      n = "_illuminanceLDR" in l;
      s = "_illuminanceHDR" in l;
      n || (l._illuminanceLDR = l._illuminance * c);
      s || (l._illuminanceHDR = l._illuminance);
    }

    if (
      (l.__type__ === "cc.SpotLight" || l.__type__ === "cc.SphereLight") &&
      !((n = "_luminanceLDR" in l),
      (s = "_luminanceHDR" in l),
      n || (l._luminanceLDR = l._luminance * c * 10000) /* 1e4 */,
      s)
    ) {
      l._luminanceHDR = l._luminance;
    }
  }
}
async function migrateFogData(e) {
  var a;
  var t;
  for (const i of e.getSwapSpace().json || (await readJSON(e.source))) {
    if (i.__type__ === "cc.FogInfo") {
      a = "_fogColor" in i;
      t = "_accurate" in i;

      a &&
        ((i._fogColor.r = Math.floor(255 * Math.sqrt(i._fogColor.r / 255))),
        (i._fogColor.g = Math.floor(255 * Math.sqrt(i._fogColor.g / 255))),
        (i._fogColor.b = Math.floor(255 * Math.sqrt(i._fogColor.b / 255))));

      t || (i._accurate = false);
    }
  }
}
async function migrateSkyLightingTypeData(e) {
  for (const r of e.getSwapSpace().json || (await readJSON(e.source))) {
    if (r.__type__ === "cc.SkyboxInfo") {
      let e = false;
      let a = false;
      var t = "_useIBL" in r;
      var i = "_applyDiffuseMap" in r;

      if (t) {
        e = r._useIBL;
        delete r._useIBL;
      }

      if (i) {
        a = r._applyDiffuseMap;
        delete r._applyDiffuseMap;
      }

      if (e) {
        r._envLightingType = 1;
        a && (r._envLightingType = 2);
      } else {
        r._envLightingType = 0;
      }
    }
  }
}
async function migrateLightBakeable(e) {
  for (const a of e.getSwapSpace().json || (await readJSON(e.source))) {
    if (a.__type__ === "cc.StaticLightSettings" && a._bakeable) {
      delete a._bakeable;
    }
  }
}
async function migrateShadowsData(e) {
  e = e.getSwapSpace().json || (await readJSON(e.source));
  let a = {};
  for (const t of e) {
    if (t.__type__ === "cc.ShadowsInfo") {
      a = {
        enabled: t._enabled !== undefined && t._enabled,
        pcf: t._pcf === undefined ? 0 : t._pcf,
        bias: t._bias === undefined ? 0 : t._bias,
        normalBias: t._normalBias === undefined ? 0 : t._normalBias,
        saturation: t._saturation === undefined ? 1 : t._saturation,
        shadowDistance:
          t._shadowDistance === undefined ? 100 : t._shadowDistance,
        invisibleOcclusionRange:
          t._invisibleOcclusionRange === undefined
            ? 200
            : t._invisibleOcclusionRange,
        fixedArea: t._fixedArea !== undefined && t._fixedArea,
        near: t._near === undefined ? 0.1 : t._near,
        far: t._far === undefined ? 10 : t._far,
        orthoSize: t._orthoSize === undefined ? 5 : t._orthoSize,
      };

      if ("_firstSetCSM" in t) {
        delete t._firstSetCSM;
      }

      if ("_fixedArea" in t) {
        delete t._fixedArea;
      }

      if ("_pcf" in t) {
        delete t._pcf;
      }

      if ("_bias" in t) {
        delete t._bias;
      }

      if ("_normalBias" in t) {
        delete t._normalBias;
      }

      if ("_near" in t) {
        delete t._near;
      }

      if ("_far" in t) {
        delete t._far;
      }

      if ("_shadowDistance" in t) {
        delete t._shadowDistance;
      }

      if ("_invisibleOcclusionRange" in t) {
        delete t._invisibleOcclusionRange;
      }

      if ("_orthoSize" in t) {
        delete t._orthoSize;
      }

      if ("_saturation" in t) {
        delete t._saturation;
      }

      if ("_aspect" in t) {
        delete t._aspect;
      }

      break;
    }
  }
  for (const i of e) {
    if (i.__type__ === "cc.DirectionalLight") {
      i._shadowEnabled = a.enabled;
      i._shadowPcf = a.pcf;
      i._shadowBias = a.bias;
      i._shadowNormalBias = a.normalBias;
      i._shadowSaturation = a.saturation;
      i._shadowDistance = a.shadowDistance;
      i._shadowInvisibleOcclusionRange = a.invisibleOcclusionRange;
      i._shadowFixedArea = a.fixedArea;
      i._shadowNear = a.near;
      i._shadowFar = a.far;
      i._shadowOrthoSize = a.orthoSize;
    }

    if (i.__type__ === "cc.SpotLight") {
      i._shadowEnabled = a.enabled;
      i._shadowPcf = a.pcf;
      i._shadowBias = a.bias;
      i._shadowNormalBias = a.normalBias;
    }
  }
}
async function migratePunctualLightLuminance(e) {
  var a;
  var t;
  var i;
  for (const r of e.getSwapSpace().json || (await readJSON(e.source))) {
    if (r.__type__ === "cc.SpotLight" || r.__type__ === "cc.SphereLight") {
      a = "_luminance" in r;
      t = "_luminanceLDR" in r;
      i = "_luminanceHDR" in r;
      a && (r._luminance *= 3.14159);
      t && (r._luminanceLDR *= 3.14159);
      i && (r._luminanceHDR *= 3.14159);
    }
  }
}
async function migrateCSMData(e) {
  for (const a of e.getSwapSpace().json || (await readJSON(e.source))) {
    if (a.__type__ === "cc.DirectionalLight") {
      if ("_shadowFixedArea" in a) {
        if (a._shadowFixedArea) {
          a._csmLevel = a._csmLevel === undefined ? 4 : a._csmLevel;
        } else {
          a._csmLevel = a._csmLevel === undefined ? 1 : a._csmLevel;
        }
      } else {
        a._shadowFixedArea = false;
        a._csmLevel = a._csmLevel === undefined ? 4 : a._csmLevel;
      }

      a._csmLayerLambda =
        a._csmLayerLambda === undefined ? 0.75 : a._csmLayerLambda;
      a._csmOptimizationMode =
        a._csmOptimizationMode === undefined ? 2 : a._csmOptimizationMode;
      break;
    }
  }
}
const spriteJson = `{
    "__type__": "cc.Sprite",
    "_name": "",
    "_objFlags": 0,
    "node": null,
    "_enabled": true,
    "__prefab": null,
    "_customMaterial": null,
    "_srcBlendFactor": 2,
    "_dstBlendFactor": 4,
    "_color": {
      "__type__": "cc.Color",
      "r": 255,
      "g": 255,
      "b": 255,
      "a": 255
    },
    "_spriteFrame": null,
    "_type": 0,
    "_fillType": 0,
    "_sizeMode": 1,
    "_fillCenter": {
      "__type__": "cc.Vec2",
      "x": 0,
      "y": 0
    },
    "_fillStart": 0,
    "_fillRange": 0,
    "_isTrimmedMode": true,
    "_useGrayscale": false,
    "_atlas": null,
    "_id": "a5Zd2oPN1CmbHXHJsmc75Z"
}`;
async function migrateMaskImageStencil(e) {
  var a;
  var t;
  var i;
  var r;
  var o = e.getSwapSpace().json || (await readJSON(e.source));
  for (const _ of o) {
    if (_.__type__ === "cc.Mask") {
      (a = _)._type === 3 &&
        a._spriteFrame !== null &&
        ((t = o[a.node.__id__]),
        ((i = JSON.parse(spriteJson)).node = a.node),
        (i._spriteFrame = a._spriteFrame),
        (i._enabled = a._enabled),
        (r = o.length),
        o.push(i),
        t._components.push({ __id__: r }),
        (i._spriteFrame = a._spriteFrame),
        (i._id = Editor.Utils.UUID.generate()),
        t._prefab) &&
        (((r = JSON.parse(getCompPrefabInfoStr())[0]).fileId =
          Editor.Utils.UUID.generate()),
        (i._prefab = { __id__: o.length }),
        o.push(r));

      delete a._spriteFrame;
    }
  }
}
async function migrateMaskImageStencilSizeMode(e) {
  var a = e.getSwapSpace().json || (await readJSON(e.source));
  for (const i of a) {
    if (i.__type__ === "cc.Mask") {
      var t = i;
      for (const r of a) {
        if (r.__type__ === "cc.Sprite" && r.node?.__id__ === t.node?.__id__) {
          r._sizeMode = 0;

          r._color = {
            __type__: "cc.Color",
            r: 255,
            g: 255,
            b: 255,
            a: 255,
          };
        }
      }
    }
  }
}
async function migrateLabelOutlineAndShadow(e) {
  var a = e.getSwapSpace().json || (await readJSON(e.source));
  for (const i of a) {
    if (i.__type__ === "cc.Label") {
      var t = i;
      for (const r of a) {
        if (r?.node && t?.node && r.node.__id__ === t.node.__id__) {
          if (r.__type__ === "cc.LabelOutline") {
            t._enableOutline = r._enabled;
            t._outlineWidth = r._width;

            t._outlineColor =
              r._color !== undefined
                ? JSON.parse(JSON.stringify(r._color))
                : { __type__: "cc.Color", r: 0, g: 0, b: 0, a: 255 };

            delete r._width;
            delete r._color;
          } else if (r.__type__ === "cc.LabelShadow") {
            t._enableShadow = r._enabled;
            t._shadowBlur = r._blur;

            t._shadowOffset =
              r._offset !== undefined
                ? JSON.parse(JSON.stringify(r._offset))
                : { __type__: "cc.Vec2", x: 2, y: 2 };

            t._shadowColor =
              r._color !== undefined
                ? JSON.parse(JSON.stringify(r._color))
                : { __type__: "cc.Color", r: 0, g: 0, b: 0, a: 255 };

            delete r._blur;
            delete r._offset;
            delete r._color;
          }
        }
      }
    }
  }
}
async function migrateBakeSettings(e) {
  for (const a of e.getSwapSpace().json || (await readJSON(e.source))) {
    if (a.__type__ === "cc.MeshRenderer" && a.lightmapSettings) {
      a.bakeSettings = a.lightmapSettings;
      a.lightmapSettings = null;
    }

    if (a.__type__ === "cc.ModelLightmapSettings") {
      a.__type__ = "cc.ModelBakeSettings";
    }
  }
}
async function migrateBloomThreshold(e) {
  for (const t of e.getSwapSpace().json || (await readJSON(e.source))) {
    if (t.__type__ === "cc.Bloom" && "_threshold" in t && t._threshold) {
      var t_threshold = t._threshold;
      t._threshold = linearToSRGB(t_threshold);
      break;
    }
  }
}
async function migratePrefabParentNull(e) {
  if (e.extname === ".prefab") {
    const _ = e.getSwapSpace().json || (await readJSON(e.source));
    e = _[0]?.data;
    if (!e.__id__) {
      return false;
    }
    var a = _[e.__id__];
    if (!a) {
      return false;
    }
    !(function a(t, i) {
      if (t._children) {
        for (let e = t._children.length - 1; e >= 0; e--) {
          var r = t._children[e];
          var o = _[r.__id__];

          if (o) {
            if (o._parent === null) {
              o._parent = { __id__: i };
              t._children.splice(e, 1);
            } else {
              a(o, r.__id__);
            }
          }
        }
      }
    })(a, e.__id__);
  }
  return true;
}
async function migrateFXAA(e) {
  for (const a of e.getSwapSpace().json || (await readJSON(e.source))) {
    if (a.__type__ === "cc.Fxaa") {
      a.__type__ = "cc.FXAA";
    }
  }
}
