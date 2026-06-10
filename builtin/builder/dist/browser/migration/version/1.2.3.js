async function migrateProfile_1_2_3() {
  if (await Editor.Profile.getConfig("builder", "", "local")) {
    for (const e of [
      "web-mobile",
      "web-desktop",
      "wechatgame",
      "oppo-mini-game",
      "huawei-quick-game",
      "vivo-mini-game",
      "alipay-mini-game",
      "xiaomi-quick-game",
      "baidu-mini-game",
      "cocos-play",
      "native",
    ]) {
      var i = await Editor.Profile.getConfig("builder", e + "." + e, "local");
      if (i) {
        await Editor.Profile.setConfig(e, "options." + e, i);

        if (e === "native") {
          var o = await Editor.Profile.getConfig("builder", "native", "local");
          for (const a of ["windows", "ios", "mac", "android", "ohos"]) {
            if (o[a]) {
              await Editor.Profile.setConfig(e, "options." + a, o[a], "local");
            }
          }
        }
      }
      await Editor.Profile.removeConfig("builder", "" + e);
      await Editor.Profile.removeConfig("builder", "version." + e);
    }
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateProfile_1_2_3 = migrateProfile_1_2_3;
