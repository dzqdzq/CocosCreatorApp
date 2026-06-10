var __awaiter =
  (this && this.__awaiter) ||
  ((o, i, a, l) =>
    new (a = a || Promise)((t, e) => {
      function n(o) {
        try {
          s(l.next(o));
        } catch (o) {
          e(o);
        }
      }
      function r(o) {
        try {
          s(l.throw(o));
        } catch (o) {
          e(o);
        }
      }
      function s(o) {
        var e;

        if (o.done) {
          t(o.value);
        } else {
          ((e = o.value) instanceof a
            ? e
            : new a((o) => {
                o(e);
              })
          ).then(n, r);
        }
      }
      s((l = l.apply(o, i || [])).next());
    }));
Object.defineProperty(exports, "__esModule", { value: true });

exports.onAfterMake = undefined;
exports.onBeforeMake = undefined;
exports.onError = undefined;
exports.unload = undefined;
exports.onAfterBuild = undefined;
exports.onAfterCompressSettings = undefined;
exports.onBeforeCompressSettings = undefined;
exports.onBeforeBuild = undefined;
exports.load = undefined;
exports.throwError = undefined;

const global_1 = require("./global");
function log(...o) {
  return console.log(`[${global_1.PACKAGE_NAME}] `, ...o);
}
let allAssets = [];
exports.throwError = true;

const load = function () {
  return __awaiter(this, undefined, undefined, function* () {
    console.log(
      `[${global_1.PACKAGE_NAME}] Load cocos plugin example in builder.`
    );

    allAssets = yield Editor.Message.request("asset-db", "query-assets");
  });
};

exports.load = load;

const onBeforeBuild = function (o, e) {
  return __awaiter(this, undefined, undefined, function* () {
    log(global_1.PACKAGE_NAME + ".webTestOption", "onBeforeBuild");
  });
};

exports.onBeforeBuild = onBeforeBuild;

const onBeforeCompressSettings = function (o, e) {
  return __awaiter(this, undefined, undefined, function* () {
    if (o.packages[global_1.PACKAGE_NAME].webTestOption) {
      console.debug("webTestOption", true);
    }

    console.debug("get settings test", e.settings);
  });
};

exports.onBeforeCompressSettings = onBeforeCompressSettings;

const onAfterCompressSettings = function (o, e) {
  return __awaiter(this, undefined, undefined, function* () {
    console.log("webTestOption", "onAfterCompressSettings");
  });
};

exports.onAfterCompressSettings = onAfterCompressSettings;

const onAfterBuild = function (o, n) {
  return __awaiter(this, undefined, undefined, function* () {
    var o = { image: "57520716-48c8-4a19-8acf-41c9f8777fb0" };
    for (const t of Object.keys(o)) {
      var e = o[t];
      console.debug("containsAsset of " + t, n.containsAsset(e));
      console.debug("getAssetPathInfo of " + t, n.getAssetPathInfo(e));
      console.debug("getRawAssetPaths of " + t, n.getRawAssetPaths(e));
      console.debug("getJsonPathInfo of " + t, n.getJsonPathInfo(e));
    }
  });
};

exports.onAfterBuild = onAfterBuild;

const unload = function () {
  return __awaiter(this, undefined, undefined, function* () {
    console.log(
      `[${global_1.PACKAGE_NAME}] Unload cocos plugin example in builder.`
    );
  });
};

exports.unload = unload;

const onError = function (o, e) {
  return __awaiter(this, undefined, undefined, function* () {
    console.warn(global_1.PACKAGE_NAME + " run onError");
  });
};

exports.onError = onError;

const onBeforeMake = function (o, e) {
  return __awaiter(this, undefined, undefined, function* () {
    console.log(`onBeforeMake: root: ${o}, options: ` + e);
  });
};

exports.onBeforeMake = onBeforeMake;

const onAfterMake = function (o, e) {
  return __awaiter(this, undefined, undefined, function* () {
    console.log(`onAfterMake: root: ${o}, options: ` + e);
  });
};

exports.onAfterMake = onAfterMake;
