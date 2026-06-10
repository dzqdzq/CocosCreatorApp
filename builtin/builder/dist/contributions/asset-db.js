Object.defineProperty(exports, "__esModule", { value: true });
exports.queryAllAssets = queryAllAssets;
exports.queryAssetsByOptions = queryAssetsByOptions;
exports.recursively = recursively;
exports.encodeAsset = encodeAsset;
exports.searchAssets = searchAssets;
exports.initBundleConfig = initBundleConfig;
const message_1 = require("./../worker/message");

const {
  filterAssetWithBundleConfig,
} = require("../worker/builder/utils/bundle");

exports.methods = {
  async queryAllAssets() {
    var s = await Manager.assetManager.queryAssetInfos();
    var t = [];
    for (let e = 0; e < s.length; e++) {
      var a = s[e];

      if (!a.isDirectory && a.importer !== "database") {
        a.mtime = Manager.assetDBManager.assetDBMap.assets.infoManager.get(
          a.file
        )?.time;

        t.push(a);
      }
    }
    return t;
  },
  async queryAssetInfo(e) {
    e = await Manager.assetManager.queryAssetInfo(e);

    if (e) {
      e.mtime = Manager.assetDBManager.assetDBMap.assets.infoManager.get(
        e.file
      )?.time;
    }

    return e;
  },
  queryAssetsByOptions,
  initWorkerMessage: message_1.init,
  initBundleConfig,
  async queryAssetsInBundle(e, s) {
    var t = Manager.assetManager.queryAsset(e);
    if (!t) {
      console.warn(`Can not find bundle asset(${e})`);
      return [];
    }
    s = s || t.meta.userData.bundleFilterConfig;
    e = queryAssetsByOptions({ pattern: t.url + "/**/*", deep: true });
    return s
      ? ((t = await initBundleConfig((t = JSON.parse(JSON.stringify(s))))),
        filterAssetWithBundleConfig(e, t).map((e) => e.url))
      : e;
  },
};

const minimatch = require("minimatch");

async function queryAllAssets() {
  var s = await queryAssetsByOptions();
  const t = [];
  for (let e = 0; e < s.length; e++) {
    var a = s[e];

    if (!a.isDirectory && a.importer !== "database") {
      a.mtime = Manager.assetDBManager.assetDBMap.assets.infoManager.get(
        a.file
      )?.time;

      recursively(a, (e) => {
        t.push(e);
      });
    }
  }
  return t;
}
function queryAssetsByOptions(e = {}) {
  const s = [];
  for (const a in Manager.assetDBManager.assetDBMap) {
    var t;

    if (a in Manager.assetDBManager.assetDBMap) {
      t = Manager.assetDBManager.assetDBMap[a];

      (typeof e.pattern == "string" && !e.pattern.startsWith("db://" + a)) ||
        ((t = searchAssets(Array.from(t.uuid2asset.values()), e)),
        e.deep
          ? t.forEach((e) => {
              recursively(e, (e) => {
                s.push(encodeAsset(e));
              });
            })
          : s.push(...t.map((e) => encodeAsset(e))));
    }
  }
  return s;
}
function recursively(s, t) {
  if (s.subAssets) {
    t && t(s);

    Object.keys(s.subAssets).forEach((e) => {
      recursively(s.subAssets[e], t);
    });
  }
}
function encodeAsset(e) {
  var s = Manager.assetManager.encodeAsset(e);

  var t =
    (e._parent
      ? ((t = Manager.assetManager.encodeAsset(e._parent)),
        (s.fatherInfo = {
          source: t.source,
          library: t.library,
          uuid: t.uuid,
        }),
        (s.mtime = Manager.assetDBManager.assetDBMap.assets.infoManager.get(
          e._parent.source
        )?.time))
      : (s.mtime = Manager.assetDBManager.assetDBMap.assets.infoManager.get(
          e.source
        )?.time),
    (s.userData = e.meta.userData),
    e._assetDB.dataManager.dataMap[e.uuid]);

  if (t && t.value && t.value.depends) {
    s.depends = t.value.depends;
  } else {
    s.depends = [];
  }

  return s;
}
function searchAssets(e, s) {
  let t = [];
  return (t = t.concat(e)).filter(
    (e) =>
      !(
        (s.pattern &&
          typeof s.pattern == "string" &&
          !minimatch(e.url, s.pattern)) ||
        (s.importer &&
          typeof s.importer == "string" &&
          e.meta.importer !== s.importer)
      )
  );
}
function initBundleConfig(e) {
  if (!e || !e.length) {
    return [];
  }
  var s = [];
  for (const r of JSON.parse(JSON.stringify(e))) {
    if (r.type !== "url" && r.assets && r.assets.length) {
      const n = new Set();
      const i = new Set();
      for (const u of r.assets) {
        var t;
        var a = u && Manager.assetManager.queryAsset(u);

        if (a) {
          if (a.isDirectory()) {
            s.push({
              type: "url",
              range: r.range,
              patchOption: { patchType: "glob", value: a.url + "/**/*" },
            });

            i.add(a.uuid);
          } else {
            Manager.assetManager.queryAssetProperty(a, "type") ===
              "cc.Texture2D" &&
              ((t = Manager.assetManager.queryAsset(u.replace("@6c48a", ""))),
              Manager.assetManager.queryAssetProperty(t, "type") ===
                "cc.ImageAsset") &&
              n.add(t.uuid);

            a.subAssets &&
              Object.values(a.subAssets).forEach((e) => {
                n.add(e.uuid);
              });
          }
        }
      }

      r.assets = r.assets.filter((e) => !i.has(e));

      r.assets.push(...Array.from(n));

      if (r.assets.length) {
        s.push(r);
      }
    } else {
      s.push(r);
    }
  }
  return s;
}
