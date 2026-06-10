const PROGRAM_KEY = {
  wechat_devtools: "wechatDevtools",
  android_ndk: "androidNDK",
  android_sdk: "androidSDK",
  ohos_ndk: "ohosNDK",
  ohos_sdk: "ohosSDK",
  bytedance_devtools: "bytedanceDevtools",
  script_editor: "scriptEditor",
  picture_editor: "pictureEditor",
  bytedance_app_path: "bytedanceAppPath",
};

const NOT_UNDERLINE = ["cmake", "browser"];
exports.migrateGlobal = async (o) => {
  if (o && typeof o == "object") {
    for (const t in o) {
      if (
        t !== "__version__" &&
        ((o[t] = o[t].path), typeof o[t] == "string")
      ) {
        if (PROGRAM_KEY[t]) {
          o[PROGRAM_KEY[t]] = { path: o[t] };
        } else if (NOT_UNDERLINE.includes(t)) {
          o[t + "V2"] = { path: o[t] };
        }
      }
    }
  }
};
