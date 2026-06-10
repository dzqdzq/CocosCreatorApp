function migrateLocal(a) {
  const i = [
    "mac",
    "windows",
    "ios",
    "android",
    "huawei-agc",
    "ohos",
    "harmonyos-next",
  ];

  const o = [
    "cocos-play",
    "vivo-mini-game",
    "oppo-mini-game",
    "huawei-quick-game",
    "xiaomi-quick-game",
  ];

  function e(e) {
    if (i.includes(e.platform) && e.packages && e.packages.native) {
      !e.buildStageGroup &&
        e.packages.native.makeAfterBuild &&
        (e.buildStageGroup = { build: ["make"] });

      delete e.packages.native.makeAfterBuild;
    }

    if (o.includes(e.platform)) {
      e.buildStageGroup ||
        e.packages[e.platform].makeAfterBuild === false ||
        (e.buildStageGroup = { build: ["make"] });

      delete e.packages[e.platform].makeAfterBuild;
    }

    Object.keys(e.packages).forEach((a) => {
      e.packages[a].__version__ = "1.0.0";
    });
  }

  if (a.command) {
    e(a.__buildTaskOptions__);
  } else if (a.BuildTaskManager && a.BuildTaskManager.taskMap) {
    Object.values(a.BuildTaskManager.taskMap).forEach((a) => {
      e(a.options);
    });
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateLocal = migrateLocal;
