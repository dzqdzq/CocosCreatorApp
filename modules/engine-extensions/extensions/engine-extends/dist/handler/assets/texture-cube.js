var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, r, a = r) => {
        var s = Object.getOwnPropertyDescriptor(t, r);

        if (
          !s ||
          (!("get" in s) ? !s.writable && !s.configurable : t.__esModule)
        ) {
          s = {
            enumerable: true,
            get() {
              return t[r];
            },
          };
        }

        Object.defineProperty(e, a, s);
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
    var s = (e) =>
      (s =
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
        for (var r = s(e), a = 0; a < r.length; a++) {
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
exports.TextureCubeHandler = undefined;
exports.makeDefaultTextureCubeAssetUserData =
  makeDefaultTextureCubeAssetUserData;
const asset_db_1 = require("@editor/asset-db");

const { queryUUID } = asset_db_1;

const cc = __importStar(require("cc"));

const { getDependUUIDList } = require("../utils");

const texture_base_1 = require("./texture-base");

const { makeDefaultTextureBaseAssetUserData, applyTextureBaseAssetUserData } =
  texture_base_1;

const { loadAssetSync } = require("./utils/load-asset-sync");

function makeDefaultTextureCubeAssetUserData() {
  var e = makeDefaultTextureBaseAssetUserData();
  e.isRGBE = false;
  return e;
}

exports.TextureCubeHandler = {
  name: "texture-cube",
  assetType: "cc.TextureCube",
  createInfo: {
    generateMenuInfo() {
      return [
        {
          label: "i18n:ENGINE.assets.newCubeMap",
          fullFileName: "cubemap.cubemap",
          content: "",
        },
      ];
    },
  },
  importer: {
    version: "1.0.4",
    migrations: [
      { version: "1.0.3", migrate: texture_base_1.migrateAnisotropy },
    ],
    async import(t) {
      if (Object.getOwnPropertyNames(t.userData).length === 0) {
        t.assignUserData(makeDefaultTextureCubeAssetUserData(), true);
        t.userData.isRGBE = false;
      }

      var t_userData = t.userData;
      var a = {};
      for (const n of ["front", "back", "left", "right", "top", "bottom"]) {
        let e = t_userData[n];
        if (!e) {
          var s = `db://internal/default_cubemap/${n}.jpg`;
          var u = queryUUID(s);
          if (!u) {
            throw new Error(
              `[[internal-error]] Default face url ${s} doesn't exists.`
            );
          }
          e = u;
        }
        s = loadAssetSync(e, cc.ImageAsset);
        if (!s) {
          throw new Error(`Failed to load ${n} face of ${t.uuid}.`);
        }
        a[n] = s;
      }
      var e = new cc.TextureCube();

      var e =
        (applyTextureBaseAssetUserData(t_userData, e),
        t.parent instanceof asset_db_1.Asset &&
          (e.name = t.parent.basename || ""),
        (e.isRGBE = t_userData.isRGBE),
        (e._mipmaps = [a]),
        EditorExtends.serialize(e));

      var e = (await t.saveToLibrary(".json", e), getDependUUIDList(e));

      t.setData("depends", e);
      return true;
    },
  },
};

exports.default = exports.TextureCubeHandler;
