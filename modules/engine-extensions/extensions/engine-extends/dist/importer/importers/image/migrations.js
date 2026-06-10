var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, r, a = r) => {
        Object.defineProperty(e, a, {
          enumerable: true,
          get() {
            return t[r];
          },
        });
      }
    : (e, t, r, a) => {
        e[(a = a === undefined ? r : a)] = t[r];
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

exports.migratePlatformSettings = undefined;
exports.migrateFixAlphaTransparencyArtifacts = undefined;
exports.migrations = undefined;

const migratesNameToId = __importStar(require("../migrates/name2id"));
const lodash = require("lodash");
const resolveQueue = [];
function checkQueue() {
  return new Promise((e) => {
    resolveQueue.push(e);

    if (resolveQueue.length === 1) {
      e();
      e.hasResolve = true;
    }
  });
}
function migrateStep() {
  var e = resolveQueue.shift();

  if (e) {
    e();
  }

  if (e && e.hasResolve) {
    migrateStep();
  }
}
function migrateFixAlphaTransparencyArtifacts(e) {
  e.userData.fixAlphaTransparencyArtifacts = false;
}
async function migratePlatformSettings(e) {
  const r = e.userData.platformSettings;
  var t;

  if (r && Object.keys(r).length !== 0) {
    await checkQueue();
    t = { useCompressTexture: true, presetId: "" };

    r.default && Object.keys(r).length === 1
      ? ["miniGame", "web", "android", "ios", "pc"].forEach((e) => {
          r[e] = r.default;
        })
      : Object.keys(r).forEach((e) => {
          var t;

          if (e !== "default") {
            e !== "default" &&
              r.default &&
              ((t = JSON.parse(JSON.stringify(r.default))),
              (r[e] = Object.assign(t, r[e])));

            migrateCompressTextureType(r[e]);

            e === "wechat"
              ? ((r.miniGame = r.wechat), delete r.wechat)
              : e === "html5" && ((r.web = r.html5), delete r.html5);
          }
        });

    delete r.default;

    Object.keys(r).length !== 0 &&
      ((t.presetId = await getPresetId(r)),
      delete e.userData.platformSettings,
      (e.userData.compressSettings = t));

    migrateStep();
  }
}
function migrateCompressTextureType(t) {
  if (t) {
    const r = {
      pvrtc_4bits: "pvrtc_4bits_rgba",
      pvrtc_2bits: "pvrtc_2bits_rgba",
      etc1: "etc1_rgb",
    };
    Object.keys(t).forEach((e) => {
      if (r[e]) {
        t[r[e]] = t[e];
        delete t[e];
      }
    });
  }
}
async function getPresetId(e) {
  var t = "presetId" + Date.now();
  let r = await Editor.Profile.getProject(
    "builder",
    "textureCompressConfig.userPreset"
  );
  if (r) {
    for (const a of Object.keys(r)) {
      if (lodash.isEqual(r[a].options, e)) {
        return a;
      }
    }
    await Editor.Profile.setProject(
      "builder",
      "textureCompressConfig.userPreset." + t,
      { name: t, options: e }
    );
  } else {
    r = { [t]: { name: t, options: e } };

    await Editor.Profile.setProject(
      "builder",
      "textureCompressConfig.userPreset",
      r
    );
  }
  return t;
}

exports.migrations = [
  {
    version: "1.0.13",
    async migrate(t) {
      var r;
      var a;
      var s = Object.keys(t.meta.subMetas);
      if (s.length === 1) {
        let e;
        switch (t.meta.userData.type) {
          case "raw": {
            break;
          }
          case "texture": {
            e = "texture";
            break;
          }
          case "normal map": {
            e = "normalMap";
            break;
          }
          case "texture cube": {
            e = "textureCube";
            break;
          }
          case "sprite-frame": {
            e = "spriteFrame";
          }
        }

        if (e && s[0] !== e) {
          r = t.meta.subMetas[e] = t.meta.subMetas[s[0]];
          a = t.subAssets[e] = t.subAssets[s[0]];
          r.uuid = r.uuid.replace("@" + s[0], "@" + e);
          a.meta.uuid = a.uuid.replace("@" + s[0], "@" + e);
          delete t.meta.subMetas[s[0]];
          delete t.subAssets[s[0]];
        }
      }
    },
  },
  { version: "1.0.15", migrate: migratesNameToId.migrate },
  { version: "1.0.21", migrate: migratePlatformSettings },
  { version: "1.0.23", migrate: migrateFixAlphaTransparencyArtifacts },
];

exports.migrateFixAlphaTransparencyArtifacts =
  migrateFixAlphaTransparencyArtifacts;
exports.migratePlatformSettings = migratePlatformSettings;
