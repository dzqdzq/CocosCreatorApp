var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, r, t, n = t) => {
        var a = Object.getOwnPropertyDescriptor(r, t);

        if (
          !a ||
          (!("get" in a) ? !a.writable && !a.configurable : r.__esModule)
        ) {
          a = {
            enumerable: true,
            get() {
              return r[t];
            },
          };
        }

        Object.defineProperty(e, n, a);
      }
    : (e, r, t, n) => {
        e[(n = n === undefined ? t : n)] = r[t];
      });

var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? (e, r) => {
        Object.defineProperty(e, "default", { enumerable: true, value: r });
      }
    : (e, r) => {
        e.default = r;
      });

var __importStar =
  (this && this.__importStar) ||
  (() => {
    var a = (e) =>
      (a =
        Object.getOwnPropertyNames ||
        ((e) => {
          var r;
          var t = [];
          for (r in e) {
            if (Object.prototype.hasOwnProperty.call(e, r)) {
              t[t.length] = r;
            }
          }
          return t;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var r = {};
      if (e != null) {
        for (var t = a(e), n = 0; n < t.length; n++) {
          if (t[n] !== "default") {
            __createBinding(r, e, t[n]);
          }
        }
      }
      __setModuleDefault(r, e);
      return r;
    };
  })();

Object.defineProperty(exports, "__esModule", { value: true });
exports.TerrainHandler = undefined;
const fs = __importStar(require("fs-extra"));
const index_1 = require("./scene/index");
const cc_1 = require("cc");

const { getDependUUIDList } = require("../utils");

exports.TerrainHandler = {
  name: "terrain",
  assetType: "cc.TerrainAsset",
  createInfo: {
    generateMenuInfo() {
      return [
        {
          label: "i18n:ENGINE.assets.newTerrain",
          fullFileName: "terrain.terrain",
          template: `db://internal/default_file_content/${exports.TerrainHandler.name}/default.terrain`,
        },
      ];
    },
  },
  importer: {
    version: index_1.version,
    async import(e) {
      await e.copyToLibrary(".bin", e.source);
      var r = new cc_1.TerrainAsset();
      if (r._loadNativeData(new Uint8Array(fs.readFileSync(e.source)))) {
        r.layerInfos.length = r.layerBinaryInfos.length;
        for (let e = 0; e < r.layerInfos.length; ++e) {
          var t = r.layerBinaryInfos[e];
          var n = new cc_1.TerrainLayerInfo();
          n.slot = t.slot;
          n.tileSize = t.tileSize;

          if (t.detailMapId && t.detailMapId != "") {
            n.detailMap = EditorExtends.serialize.asAsset(
              t.detailMapId,
              cc_1.Texture2D
            );
          }

          if (t.normalMapId && t.normalMapId != "") {
            n.normalMap = EditorExtends.serialize.asAsset(
              t.normalMapId,
              cc_1.Texture2D
            );
          }

          n.metallic = t.metallic;
          n.roughness = t.roughness;
          r.layerInfos[e] = n;
        }
      }
      r.name = e.basename;
      r._setRawAsset(".bin");
      var a = EditorExtends.serialize(r);

      var a = (await e.saveToLibrary(".json", a), getDependUUIDList(a));

      e.setData("depends", a);
      return true;
    },
  },
};

exports.default = exports.TerrainHandler;
