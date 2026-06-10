var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, r, a = r) => {
        var i = Object.getOwnPropertyDescriptor(t, r);

        if (
          !i ||
          (!("get" in i) ? !i.writable && !i.configurable : t.__esModule)
        ) {
          i = {
            enumerable: true,
            get() {
              return t[r];
            },
          };
        }

        Object.defineProperty(e, a, i);
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
  (() => {
    var i = (e) =>
      (i =
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
        for (var r = i(e), a = 0; a < r.length; a++) {
          if (r[a] !== "default") {
            __createBinding(t, e, r[a]);
          }
        }
      }
      __setModuleDefault(t, e);
      return t;
    };
  })();

Object.defineProperty(exports, "__esModule", { value: true });
exports.migrations = undefined;
exports.migrateRedirect = migrateRedirect;
exports.migrateFixAlphaTransparencyArtifacts =
  migrateFixAlphaTransparencyArtifacts;
exports.migratePlatformSettings = migratePlatformSettings;
const migratesNameToId = __importStar(require("../migrates/name2id"));
const utils_1 = require("../../utils");
const lodash = require("lodash");
const migrateStep = new utils_1.MigrateStep();
function migrateRedirect(e) {
  if (e.userData.type !== "texture") {
    return e.userData.type === "sprite-frame"
      ? e.meta.subMetas[Editor.Utils.UUID.nameToSubId("texture")]
        ? void (e.userData.redirect =
            e.meta.subMetas[Editor.Utils.UUID.nameToSubId("texture")].uuid)
        : undefined
      : void delete e.userData.redirect;
  }
}
function migrateFixAlphaTransparencyArtifacts(e) {
  e.userData.fixAlphaTransparencyArtifacts = false;
}
async function migratePlatformSettings(e) {
  const r = e.userData.platformSettings;
  var t;

  if (r && Object.keys(r).length !== 0) {
    await migrateStep.hold();
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

    migrateStep.step();
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
      var i = Object.keys(t.meta.subMetas);
      if (i.length === 1) {
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

        if (e && i[0] !== e) {
          r = t.meta.subMetas[e] = t.meta.subMetas[i[0]];
          a = t.subAssets[e] = t.subAssets[i[0]];
          r.uuid = r.uuid.replace("@" + i[0], "@" + e);
          a.meta.uuid = a.uuid.replace("@" + i[0], "@" + e);
          delete t.meta.subMetas[i[0]];
          delete t.subAssets[i[0]];
        }
      }
    },
  },
  { version: "1.0.15", migrate: migratesNameToId.migrate },
  { version: "1.0.21", migrate: migratePlatformSettings },
  { version: "1.0.23", migrate: migrateFixAlphaTransparencyArtifacts },
  { version: "1.0.27", migrate: migrateRedirect },
];
