Object.defineProperty(exports, "__esModule", { value: true });
exports.MaterialImporter = undefined;
const asset_db_1 = require("@editor/asset-db");
const fs_extra_1 = require("fs-extra");
const migrates_1 = require("./scene/migrates");
const material_upgrader_1 = require("./utils/material-upgrader");
const utils_1 = require("../utils");
class MaterialImporter extends asset_db_1.Importer {
  get version() {
    return "1.0.13";
  }
  get name() {
    return "material";
  }
  get assetType() {
    return "cc.Material";
  }
  async validate(r) {
    try {
      return fs_extra_1.readJSONSync(r.source).__type__ === "cc.Material";
    } catch (r) {
      return false;
    }
  }
  get migrations() {
    return migrations;
  }
  get migrationHook() {
    return migrates_1.migrationHook;
  }
  async import(r) {
    try {
      var a = fs_extra_1.readJSONSync(r.source);
      var e = a._effectAsset && a._effectAsset.__uuid__;

      r.depend(e);

      if (await material_upgrader_1.upgradeProperties(a, r)) {
        fs_extra_1.writeJSONSync(r.source, a, { spaces: 2 });
      }

      a._name = r.basename || "";
      var o = JSON.stringify(a, undefined, 2);
      await r.saveToLibrary(".json", o);
      var t = utils_1.getDependUUIDList(o);
      r.setData("depends", t);
      return true;
    } catch (r) {
      console.error(r);
      return false;
    }
  }
}
exports.MaterialImporter = MaterialImporter;

const migrations = [
  { version: "1.0.5", migrate: migrates_1.migrateImageUuid },
  { version: "1.0.6", migrate: migrates_1.migrateAnimationName },
  {
    version: "1.0.7",
    async migrate(r) {
      await migrates_1.migrateNameToId(r, true);
    },
  },
  { version: "1.0.9", migrate: migrateStandardEffect },
  { version: "1.0.10", migrate: migrateLinearColor },
  { version: "1.0.11", migrate: migrateBlendColor },
  { version: "1.0.12", migrate: migrateLinearColorFixUnlitShader },
  { version: "1.0.13", migrate: migrateNormalStrength },
];

const componentMap = { r: "x", g: "y", b: "z", a: "w" };
async function migrateStandardEffect(e) {
  e = e.getSwapSpace().json || (await fs_extra_1.readJSON(e.source));
  if (e._effectAsset.__uuid__ === "1baf0fc9-befa-459c-8bdd-af1a450a0319") {
    let r = e._defines[0];

    if (!(r = r || (e._defines[0] = {})).OCCLUSION_CHANNEL) {
      r.OCCLUSION_CHANNEL = "b";
    }

    if (!r.ROUGHNESS_CHANNEL) {
      r.ROUGHNESS_CHANNEL = "r";
    }

    if (!r.METALLIC_CHANNEL) {
      r.METALLIC_CHANNEL = "g";
    }

    let a = e._props[0];

    a = a || (e._props[0] = {});

    a.occlusion =
      ((a.pbrParams && a.pbrParams[componentMap[r.OCCLUSION_CHANNEL]]) || 1) *
      ((a.pbrScale && a.pbrScale[componentMap[r.OCCLUSION_CHANNEL]]) || 1);

    a.roughness =
      ((a.pbrParams && a.pbrParams[componentMap[r.ROUGHNESS_CHANNEL]]) || 1) *
      ((a.pbrScale && a.pbrScale[componentMap[r.ROUGHNESS_CHANNEL]]) || 0.8);

    a.metallic =
      ((a.pbrParams && a.pbrParams[componentMap[r.METALLIC_CHANNEL]]) || 1) *
      ((a.pbrScale && a.pbrScale[componentMap[r.METALLIC_CHANNEL]]) || 0.6);

    if (r.USE_PBR_MAP) {
      a.occlusion = a.pbrScale && a.pbrScale[componentMap[r.OCCLUSION_CHANNEL]];
      typeof a.occlusion != "number" && (a.occlusion = 1);
      a.roughness = a.pbrScale && a.pbrScale[componentMap[r.ROUGHNESS_CHANNEL]];
      typeof a.roughness != "number" && (a.roughness = 1);
      a.metallic = a.pbrScale && a.pbrScale[componentMap[r.METALLIC_CHANNEL]];
      typeof a.metallic != "number" && (a.metallic = 1);
    } else if (r.USE_METALLIC_ROUGHNESS_MAP) {
      a.roughness = a.pbrScale && a.pbrScale[componentMap[r.ROUGHNESS_CHANNEL]];
      typeof a.roughness != "number" && (a.roughness = 1);
      a.metallic = a.pbrScale && a.pbrScale[componentMap[r.METALLIC_CHANNEL]];
      typeof a.metallic != "number" && (a.metallic = 1);
    } else if (
      r.USE_OCCLUSION_MAP &&
      ((a.occlusion =
        a.pbrScale && a.pbrScale[componentMap[r.OCCLUSION_CHANNEL]]),
      typeof a.occlusion != "number")
    ) {
      a.occlusion = 1;
    }
  }
}
async function migrateLinearColor(a) {
  var a = a.getSwapSpace().json || (await fs_extra_1.readJSON(a.source));
  var r = a._effectAsset.__uuid__ === "1baf0fc9-befa-459c-8bdd-af1a450a0319";
  var e = a._effectAsset.__uuid__ === "a7612b54-35e3-4238-a1a9-4a7b54635839";
  var o = a._effectAsset.__uuid__ === "a3cd009f-0ab0-420d-9278-b9fdab939bbc";
  var t = a._effectAsset.__uuid__ === "99498f84-efe6-43a6-a9a7-e6e93eb845c1";
  if (r || e || t) {
    let r = e ? a._props[1] : a._props[0];

    if ((r = r || (a._props[0] = {})).mainColor) {
      r.mainColor.r = Math.floor(255 * Math.sqrt(r.mainColor.r / 255));
      r.mainColor.g = Math.floor(255 * Math.sqrt(r.mainColor.g / 255));
      r.mainColor.b = Math.floor(255 * Math.sqrt(r.mainColor.b / 255));
    }

    if (r.emissive) {
      r.emissive.r = Math.floor(255 * Math.sqrt(r.emissive.r / 255));
      r.emissive.g = Math.floor(255 * Math.sqrt(r.emissive.g / 255));
      r.emissive.b = Math.floor(255 * Math.sqrt(r.emissive.b / 255));
    }

    if (
      e &&
      (r.shadeColor1 &&
        ((r.shadeColor1.r = Math.floor(255 * Math.sqrt(r.shadeColor1.r / 255))),
        (r.shadeColor1.g = Math.floor(255 * Math.sqrt(r.shadeColor1.g / 255))),
        (r.shadeColor1.b = Math.floor(255 * Math.sqrt(r.shadeColor1.b / 255)))),
      r.shadeColor2 &&
        ((r.shadeColor2.r = Math.floor(255 * Math.sqrt(r.shadeColor2.r / 255))),
        (r.shadeColor2.g = Math.floor(255 * Math.sqrt(r.shadeColor2.g / 255))),
        (r.shadeColor2.b = Math.floor(255 * Math.sqrt(r.shadeColor2.b / 255)))),
      r.specular)
    ) {
      r.specular.r = Math.floor(255 * Math.sqrt(r.specular.r / 255));
      r.specular.g = Math.floor(255 * Math.sqrt(r.specular.g / 255));
      r.specular.b = Math.floor(255 * Math.sqrt(r.specular.b / 255));
    }
  }
  if (o) {
    let r = a._props[0];

    if ((r = r || (a._props[0] = {})).mainColor) {
      r.mainColor.r = Math.floor(255 * Math.sqrt(r.mainColor.r / 255));
      r.mainColor.g = Math.floor(255 * Math.sqrt(r.mainColor.g / 255));
      r.mainColor.b = Math.floor(255 * Math.sqrt(r.mainColor.b / 255));
    }
  }
}
async function migrateLinearColorFixUnlitShader(a) {
  a = a.getSwapSpace().json || (await fs_extra_1.readJSON(a.source));
  if (a._effectAsset.__uuid__ === "a3cd009f-0ab0-420d-9278-b9fdab939bbc") {
    let r = a._props[0];

    if ((r = r || (a._props[0] = {})).mainColor) {
      r.mainColor.r = Math.floor(
        ((r.mainColor.r * r.mainColor.r) / 65535) * 255
      );

      r.mainColor.g = Math.floor(
        ((r.mainColor.g * r.mainColor.g) / 65535) * 255
      );

      r.mainColor.b = Math.floor(
        ((r.mainColor.b * r.mainColor.b) / 65535) * 255
      );
    }
  }
}
async function migrateBlendColor(r) {
  r = r.getSwapSpace().json || (await fs_extra_1.readJSON(r.source));

  if (r._states && Array.isArray(r._states)) {
    r._states.forEach((r) => {
      var a;
      var r = r.blendState;

      if (r && r.blendColor && ((a = r.blendColor), Array.isArray(a))) {
        r.blendColor = {
          __type__: "cc.Color",
          r: null != (r = a[0]) ? r : 0,
          g: null != (r = a[1]) ? r : 0,
          b: null != (r = a[2]) ? r : 0,
          a: null != (r = a[3]) ? r : 0,
        };
      }
    });
  }
}
async function migrateNormalStrength(a) {
  var a = a.getSwapSpace().json || (await fs_extra_1.readJSON(a.source));
  var r = a._effectAsset.__uuid__ === "1baf0fc9-befa-459c-8bdd-af1a450a0319";
  var e = a._effectAsset.__uuid__ === "a7612b54-35e3-4238-a1a9-4a7b54635839";
  if (r || e) {
    let r = e ? a._props[1] : a._props[0];

    if ((r = r || (a._props[0] = {})).normalStrenth) {
      r.normalStrength = r.normalStrenth;
    }
  }
}
