var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, r, i = r) => {
        var a = Object.getOwnPropertyDescriptor(t, r);

        if (
          !a ||
          (!("get" in a) ? !a.writable && !a.configurable : t.__esModule)
        ) {
          a = {
            enumerable: true,
            get() {
              return t[r];
            },
          };
        }

        Object.defineProperty(e, i, a);
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

var __importStar =
  (this && this.__importStar) ||
  (() => {
    var a = (e) =>
      (a =
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
        for (var r = a(e), i = 0; i < r.length; i++) {
          if (r[i] !== "default") {
            __createBinding(t, e, r[i]);
          }
        }
      }
      __setModuleDefault(t, e);
      return t;
    };
  })();

Object.defineProperty(exports, "__esModule", { value: true });
exports.previewBinGroup = previewBinGroup;
exports.handleBinGroup = handleBinGroup;
exports.outputBinGroup = outputBinGroup;

const { join } = require("path");

const asset_library_1 = require("../../manager/asset-library");

const { getCCONFormatAssetInLibrary } = require("../../utils/cconb");

const { stat, readFile, outputFile } = require("fs-extra");

const HashUuid = __importStar(require("../../utils/hash-uuid"));
const utils_1 = require("../../../../share/utils");

const { binPackagePack } = require("./bin-package-pack");

const PACK_FILE_TYPE_LIST = ["cc.AnimationClip"];
const KB = 1024;
async function previewBinGroup(e, t) {
  const r = [];
  const i = [];
  let a = 0;

  (
    await Promise.all(e.assetsWithoutRedirect.map((e) => analyzePack(e, t)))
  ).forEach((e) => {
    if (e.shouldPack) {
      r.push(e.uuid);
      i.push(e.size);
      a += e.size;
    }
  });

  return { uuidList: r, sizeList: i, totalSize: a };
}
async function handleBinGroup(e, t) {
  if (t && t.enable) {
    console.debug(`Handle binary group in bundle ${e.name}: start`);

    (t = (await previewBinGroup(e, t.threshold * KB)).uuidList).length <= 1
      ? console.debug(
          `Handle binary group in bundle ${e.name}: no need to handle`
        )
      : (t.sort(utils_1.compareUUID),
        e.addGroup(
          "BIN",
          t,
          HashUuid.calculate([t], HashUuid.BuiltinHashType.PackedAssets)[0]
        ),
        console.debug(`Handle binary group in bundle ${e.name}: success`));
  }
}
async function outputBinGroup(e, t) {
  if (t && t.enable && (t = e.groups.find((e) => e.type == "BIN"))) {
    await outputOneBinGroup(t, e);
  }
}
async function getAssetSize(e) {
  e = getCCONFormatAssetInLibrary(e);
  return (await stat(e)).size;
}
async function analyzePack(e, t) {
  var r = asset_library_1.buildAssetLibrary.getAsset(e);
  var i = asset_library_1.buildAssetLibrary.getAssetProperty(r, "type");
  return PACK_FILE_TYPE_LIST.includes(i)
    ? { uuid: e, shouldPack: (i = await getAssetSize(r)) <= t, size: i }
    : { uuid: e, shouldPack: false, size: 0 };
}
function getOutputFilePath(e, t) {
  return join(e.dest, e.importBase, t.slice(0, 2), t + ".bin");
}
async function outputOneBinGroup(e, t) {
  console.debug(`output bin groups in bundle ${t.name} start`);
  t.addAssetWithUuid(e.name);

  var r = await Promise.all(
    e.uuids.map((e) => {
      e = asset_library_1.buildAssetLibrary.getAsset(e);
      e = getCCONFormatAssetInLibrary(e);
      return readFile(e);
    })
  );

  var r = binPackagePack(r.map((e) => new Uint8Array(e).buffer));

  await outputFile(getOutputFilePath(t, e.name), new Uint8Array(r));
}
