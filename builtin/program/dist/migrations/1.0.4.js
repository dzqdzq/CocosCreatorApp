async function migrateGlobal(o) {
  await migrateProgram2Platform(o, "global");
}
async function migrateLocal(o) {
  await migrateProgram2Platform(o, "local");
}
async function migrateProgram2Platform(o, a) {
  for (const l in exports.programMap) {
    try {
      var e;
      var r;
      var t = exports.programMap[l].newKey;
      var i = exports.programMap[l].platform;
      var n = t === "cmakeV2" ? "cmake" : t;
      var m = await Editor.Profile.getConfig(i, n, a);

      if (!m || !m.path) {
        if (o[t] && o[t].path) {
          e = o[t];
          await Editor.Profile.setConfig(i, n, e, a);
        } else if (o[l]) {
          r = { path: o[l] };
          await Editor.Profile.setConfig(i, n, r, a);
        }
      }
    } catch (o) {
      console.error("migrate program configuration error!");
      console.debug(o);
    }
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.programMap = undefined;
exports.migrateGlobal = migrateGlobal;
exports.migrateLocal = migrateLocal;

exports.programMap = {
  android_ndk: { newKey: "androidNDK", platform: "android" },
  android_sdk: { newKey: "androidSDK", platform: "android" },
  wechat_devtools: { newKey: "wechatDevtools", platform: "wechatgame" },
  ohos_sdk: { newKey: "ohosSDK", platform: "ohos" },
  ohos_ndk: { newKey: "ohosNDK", platform: "ohos" },
  cmake: { newKey: "cmakeV2", platform: "native" },
  bytedance_devtools: {
    newKey: "bytedanceDevtools",
    platform: "bytedance-mini-game",
  },
  javaHome: { newKey: "javaHome", platform: "android" },
};
