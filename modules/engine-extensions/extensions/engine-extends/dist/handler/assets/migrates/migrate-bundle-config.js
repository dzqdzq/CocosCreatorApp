Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeBundleConfig = mergeBundleConfig;

const platformConfigs = {
  native: {
    platforms: [
      "android",
      "ohos",
      "open-harmonyos",
      "huawei-agc",
      "ios",
      "windows",
      "mac",
      "linux",
      "xr-meta",
      "xr-huaweivr",
      "xr-pico",
      "xr-rokid",
      "xr-monado",
      "xr-spaces",
      "xr-seed",
      "ar-android",
      "ar-ios",
      "xr-gsxr",
      "xr-yvr",
      "xr-htc",
      "xr-iqiyi",
      "xr-skyworth",
      "xr-ffalcon",
      "xr-nreal",
      "xr-inmo",
      "xr-lenovo",
    ],
    platformTypeInfo: {
      icon: "mobile",
      displayName: "i18n:builder.asset_bundle.native",
    },
    maxOptionList: {
      compressionType: ["none", "merge_dep", "merge_all_json"],
    },
  },
  miniGame: {
    platforms: [
      "alipay-mini-game",
      "taobao-creative-app",
      "taobao-mini-game",
      "bytedance-mini-game",
      "oppo-mini-game",
      "huawei-quick-game",
      "vivo-mini-game",
      "xiaomi-quick-game",
      "baidu-mini-game",
      "wechatgame",
      "link-sure",
      "qtt",
      "cocos-play",
    ],
    platformTypeInfo: {
      icon: "mini-game",
      displayName: "i18n:builder.asset_bundle.minigame",
    },
    maxOptionList: {
      compressionType: [
        "none",
        "merge_dep",
        "merge_all_json",
        "zip",
        "subpackage",
      ],
    },
    minOptionList: {
      compressionType: ["none", "merge_dep", "merge_all_json", "zip"],
    },
  },
  web: {
    platforms: ["fb-instant-games", "web-desktop", "web-mobile"],
    platformTypeInfo: {
      icon: "html5",
      displayName: "i18n:builder.asset_bundle.web",
    },
    maxOptionList: {
      compressionType: ["none", "merge_dep", "merge_all_json", "zip"],
    },
    minOptionList: {
      compressionType: ["none", "merge_dep", "merge_all_json"],
    },
  },
};

const platformTypeMap = {};
function mergeBundleConfig(a, r, e) {
  const m = {};

  Object.keys(platformTypeMap).forEach((e) => {
    var o = platformTypeMap[e];
    var i = { compressionType: a[e] || "merge_dep", isRemote: r[e] || false };
    var n = JSON.stringify(i);

    if (m[o]) {
      if (m[o][n]) {
        m[o][n].platforms.push(e);
      } else {
        m[o][n] = { config: i, platforms: [e] };
      }
    } else {
      m[o] = { [n]: { config: i, platforms: [e] } };
    }
  });

  const s = { displayName: e, configs: {} };

  Object.keys(m).forEach((i) => {
    var e = Object.values(m[i]).sort(
      (e, o) => o.platforms.length - e.platforms.length
    );
    if (e.length) {
      if (i !== "miniGame") {
        var o = e.shift().config;
        s.configs[i] = { preferredOptions: o };

        if (!e.length) {
          return;
        }
      } else {
        s.configs[i] = { configMode: "overwrite" };
      }
      const n = {};

      e.forEach((o) => {
        o.platforms.forEach((e) => {
          if (
            o.config.compressionType !== "merge_dep" ||
            o.config.isRemote ||
            i === "miniGame"
          ) {
            n[e] = o.config;
          }
        });
      });

      s.configs[i].overwriteSettings = n;
    }
  });

  return s;
}
Object.keys(platformConfigs).forEach((o) => {
  platformConfigs[o].platforms.forEach((e) => {
    platformTypeMap[e] = o;
  });
});
