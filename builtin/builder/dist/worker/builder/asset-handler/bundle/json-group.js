var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, s, r = s) => {
        var a = Object.getOwnPropertyDescriptor(t, s);

        if (
          !a ||
          (!("get" in a) ? !a.writable && !a.configurable : t.__esModule)
        ) {
          a = {
            enumerable: true,
            get() {
              return t[s];
            },
          };
        }

        Object.defineProperty(e, r, a);
      }
    : (e, t, s, r) => {
        e[(r = r === undefined ? s : r)] = t[s];
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
          var s = [];
          for (t in e) {
            if (Object.prototype.hasOwnProperty.call(e, t)) {
              s[s.length] = t;
            }
          }
          return s;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var t = {};
      if (e != null) {
        for (var s = a(e), r = 0; r < s.length; r++) {
          if (s[r] !== "default") {
            __createBinding(t, e, s[r]);
          }
        }
      }
      __setModuleDefault(t, e);
      return t;
    };
  })();

Object.defineProperty(exports, "__esModule", { value: true });
exports.handleJsonGroup = handleJsonGroup;
exports.outputJsonGroup = outputJsonGroup;

const { join, basename } = require("path");

const bundle_utils_1 = require("../../../../share/bundle-utils");
const asset_library_1 = require("../../manager/asset-library");

const { walk } = require("../json-group");

const HashUuid = __importStar(require("../../utils/hash-uuid"));

const { outputJSON } = require("fs-extra");

const utils_1 = require("../../../../share/utils");
const cc_1 = require("cc");
const EditorExtends = require("@base/electron-module").require("EditorExtends");
async function handleJsonGroup(s) {
  console.debug("handle json group in bundle " + s.name);

  if (s.compressionType !== bundle_utils_1.BundleCompressionTypes.NONE) {
    if (
      s.compressionType === bundle_utils_1.BundleCompressionTypes.MERGE_ALL_JSON
    ) {
      s.addGroup("NORMAL", s.assetsWithoutRedirect);
    } else {
      const r = {};
      const a = [];
      var e = [];
      for (const i of s.assetsWithoutRedirect) {
        var t = asset_library_1.buildAssetLibrary.getAsset(i);
        if (
          asset_library_1.buildAssetLibrary.getAssetProperty(t, "type") ==
          "cc.Texture2D"
        ) {
          e.push(t.uuid);
        } else {
          let e = await walk(t, s);

          if (
            e.length > 1 &&
            (e = e.filter((e) => !a.includes(e))).length > 1
          ) {
            a.push(...e);
            r[i] = e;
          }
        }
      }

      if (e.length > 1) {
        e.sort(utils_1.compareUUID);
        s.addGroup("TEXTURE", e);
      }

      Object.keys(r).forEach((t) => {
        var e = r[t];

        if (e) {
          JSON.parse(JSON.stringify(e)).forEach((e) => {
            if (t !== e && r[e]) {
              console.debug("remove group uuid " + e);
              delete r[e];
            }
          });
        }
      });

      Object.values(r).forEach((e, t) => {
        if (e.length > 1) {
          s.addGroup("NORMAL", e);
        }
      });
    }
    console.debug(`handle json group in bundle ${s.name} success`);
  }
}
async function outputJsonGroup(t, s) {
  var r = join(t.dest, t.importBase);
  console.debug("Handle all json groups in bundle " + t.name);
  let a = [];
  const i = [];
  t.groups.forEach((e) => {
    i.push(e.uuids);

    if (e.uuids.length > 1) {
      a = a.concat(e.uuids);
    }
  });
  var u = new Set(a);
  var o = HashUuid.calculate(i, HashUuid.BuiltinHashType.PackedAssets);
  console.debug("handle json group");
  const n = { debug: s.options.debug, ...s.options.assetSerializeOptions };
  for (let e = 0; e < t.groups.length; e++) {
    var l = t.groups[e];
    if (!(l.uuids.length <= 1)) {
      l.name = o[e];
      l.uuids.sort(utils_1.compareUUID);
      t.addAssetWithUuid(l.name);
      u.add(l.name);

      if (l.type === "TEXTURE") {
        p = undefined;
        c = undefined;
        d = undefined;
        var d = r;
        var c = o[e];
        var p = l;

        p = (p = await Promise.all(
          p.uuids.map(async (e) => {
            var t = await s.cache.getSerializedJSON(e, n);

            if (!t) {
              console.error(`Can't get SerializedJSON of asset {asset(${e})}`);
            }

            return t;
          })
        )).map((e) => {
          var { base: e, mipmaps } =
            EditorExtends.serializeCompiled.getRootData(e);
          return [e, mipmaps];
        });

        p = { type: cc_1.js.getClassId(cc_1.Texture2D), data: p };
        !(await y(d, c, p));
      } else if (l.type === "IMAGE") {
        p = undefined;
        c = undefined;
        d = undefined;
        d = r;
        c = o[e];
        p = l;

        p = await Promise.all(
          p.uuids.map(async (e) => {
            var t = await s.cache.getSerializedJSON(e, n);

            if (!t) {
              console.error(`Can't get SerializedJSON of asset {asset(${e})}`);
            }

            return t;
          })
        );

        p = { type: cc_1.js.getClassId(cc_1.ImageAsset), data: p };
        !(await y(d, c, p));
      } else if (l.type === "NORMAL") {
        let t = [];
        var _ = [];
        l.uuids.sort();
        for (let e = 0; e < l.uuids.length; e++) {
          var g;
          var h = asset_library_1.buildAssetLibrary.getAsset(l.uuids[e]);

          if (!h || h.meta.files.includes(".json")) {
            if ((g = await s.cache.getSerializedJSON(l.uuids[e], n))) {
              _.push(l.uuids[e]);
              t.push(g);
            } else {
              console.error(
                Editor.I18n.t("builder.error.get_asset_json_failed", {
                  url: h.url,
                  type: asset_library_1.buildAssetLibrary.getAssetProperty(
                    h,
                    "type"
                  ),
                })
              );
            }
          }
        }
        l.uuids = _;
        t = JSON.parse(JSON.stringify(t));
        t = EditorExtends.serializeCompiled.packJSONs(t);
        await y(r, o[e], t);

        console.debug(
          `Json group(${l.name}) compile success，json number: ` + t.length
        );
      }
    }
  }
  console.debug("handle single json");
  for (const m of t.assetsWithoutRedirect) {
    if (!u.has(m)) {
      var f = await s.cache.getSerializedJSON(m, n);
      if (f) {
        var b = asset_library_1.buildAssetLibrary.getAsset(m);
        let e = m;
        await y(
          r,
          (e =
            b && b.library && b.meta.files.includes(".json")
              ? basename(b.library)
              : e),
          f
        );
      }
    }
  }
  async function y(e, t, s) {
    e = join(e, t.substr(0, 2), t + ".json");
    await outputJSON(e, s);
  }
  t.groups.forEach((e) => {
    if (e.name) {
      t.addAssetWithUuid(e.name);
    }
  });
}
