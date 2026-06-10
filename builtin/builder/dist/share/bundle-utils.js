Object.defineProperty(exports, "__esModule", { value: true });

exports.DefaultBundleConfig = undefined;
exports.BundlePlatformTypes = undefined;
exports.BundlecompressionTypeMap = undefined;
exports.BuiltinBundleName = undefined;
exports.BundleCompressionTypes = undefined;

exports.getBundleDefaultName = getBundleDefaultName;
exports.genBundleRenderConfig = genBundleRenderConfig;
exports.transformPlatformSettings = transformPlatformSettings;
exports.checkRemoteDisabled = checkRemoteDisabled;
exports.getInvalidRemote = getInvalidRemote;

const { basename } = require("path");

var BundleCompressionTypes;
var BuiltinBundleName;
function getBundleDefaultName(e) {
  return basename(e.source).replace(/[^a-zA-Z0-9_-]/g, "_");
}
function genBundleRenderConfig(i, t) {
  const r = {};

  Object.keys(t).forEach((e) => {
    const s = i[e];
    s.platformName = t[e].label;

    if (r[s.platformType]) {
      r[s.platformType].platformConfigs[e] = s;
      var n = r[s.platformType].maxOptionList;
      n.compressionType = Array.from(
        new Set(n.compressionType.concat(s.supportOptions.compressionType))
      );

      const o =
        r[s.platformType].minOptionList ||
        JSON.parse(JSON.stringify(r[s.platformType].maxOptionList));

      const p = [];

      n.compressionType.forEach((e) => {
        if (
          s.supportOptions.compressionType.includes(e) &&
          o.compressionType.includes(e)
        ) {
          p.push(e);
        }
      });

      if (p.length !== n.compressionType.length) {
        r[s.platformType].minOptionList = { compressionType: p };
      }
    } else {
      r[s.platformType] = {
        platformConfigs: { [e]: s },
        platformTypeInfo: exports.BundlePlatformTypes[s.platformType],
        maxOptionList: s.supportOptions,
      };
    }
  });

  return r;
}
function transformPlatformSettings(n, o) {
  const p = {};

  Object.keys(o).forEach((e) => {
    var s = getValidOption(e, n, o);
    s.isRemote = getInvalidRemote(s.compressionType, s.isRemote);
    s.compressionType = s.compressionType || BundleCompressionTypes.MERGE_DEP;
    p[e] = s;
  });

  return p;
}
function getValidOption(e, s, n) {
  var o =
    s.configMode || (n[e].platformType === "miniGame" ? "fallback" : "auto");

  if (o === "fallback" && s.fallbackOptions) {
    return {
      ...s.preferredOptions,
      compressionType: s.fallbackOptions.compressionType,
      isRemote: s.fallbackOptions.isRemote ?? false,
    };
  }

  if (s.overwriteSettings && s.overwriteSettings[e]) {
    return s.overwriteSettings[e];
  }

  n = n[e].supportOptions.compressionType;

  return o !== "overwrite" || (s.overwriteSettings && s.overwriteSettings[e])
    ? s.preferredOptions && n.includes(s.preferredOptions.compressionType)
      ? s.preferredOptions
      : s.fallbackOptions
      ? {
          ...s.preferredOptions,
          compressionType: s.fallbackOptions.compressionType,
        }
      : { ...s.preferredOptions }
    : { compressionType: BundleCompressionTypes.MERGE_DEP, isRemote: false };
}
function checkRemoteDisabled(e) {
  return (
    e === BundleCompressionTypes.SUBPACKAGE || e === BundleCompressionTypes.ZIP
  );
}
function getInvalidRemote(e, s) {
  return (
    e !== BundleCompressionTypes.SUBPACKAGE &&
    (e === BundleCompressionTypes.ZIP || (s ?? false))
  );
}

!((e) => {
  e.NONE = "none";
  e.MERGE_DEP = "merge_dep";
  e.MERGE_ALL_JSON = "merge_all_json";
  e.SUBPACKAGE = "subpackage";
  e.ZIP = "zip";
})(
  BundleCompressionTypes ||
    (exports.BundleCompressionTypes = BundleCompressionTypes = {})
);

((e) => {
  e.RESOURCES = "resources";
  e.MAIN = "main";
  e.START_SCENE = "start-scene";
  e.INTERNAL = "internal";
})(BuiltinBundleName || (exports.BuiltinBundleName = BuiltinBundleName = {}));

exports.BundlecompressionTypeMap = {
  [BundleCompressionTypes.NONE]: "i18n:builder.asset_bundle.none",
  [BundleCompressionTypes.SUBPACKAGE]: "i18n:builder.asset_bundle.subpackage",
  [BundleCompressionTypes.MERGE_DEP]: "i18n:builder.asset_bundle.merge_dep",
  [BundleCompressionTypes.MERGE_ALL_JSON]:
    "i18n:builder.asset_bundle.merge_all_json",
  [BundleCompressionTypes.ZIP]: "i18n:builder.asset_bundle.zip",
};

exports.BundlePlatformTypes = {
  native: { icon: "mobile", displayName: "i18n:builder.asset_bundle.native" },
  web: { icon: "html5", displayName: "i18n:builder.asset_bundle.web" },
  miniGame: {
    icon: "mini-game",
    displayName: "i18n:builder.asset_bundle.minigame",
  },
};

exports.DefaultBundleConfig = {
  displayName: "i18n:builder.asset_bundle.defaultConfig",
  configs: {
    native: {
      preferredOptions: { isRemote: false, compressionType: "merge_dep" },
    },
    web: {
      preferredOptions: { isRemote: false, compressionType: "merge_dep" },
      fallbackOptions: { compressionType: "merge_dep" },
    },
    miniGame: {
      fallbackOptions: { isRemote: false, compressionType: "merge_dep" },
      configMode: "fallback",
    },
  },
};
