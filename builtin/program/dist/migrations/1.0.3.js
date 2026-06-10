const PREVIOUS_KEY = {
  wechat_devtools: "wechatDevtools",
  android_ndk: "androidNDK",
  android_sdk: "androidSDK",
  ohos_ndk: "ohosNDK",
  ohos_sdk: "ohosSDK",
  bytedance_devtools: "bytedanceDevtools",
  script_editor: "scriptEditor",
  picture_editor: "pictureEditor",
  bytedance_app_path: "bytedanceAppPath",
  cmake: "cmakeV2",
  browser: "browserV2",
};

exports.migrateGlobal = async (o) => {
  if (o && typeof o == "object") {
    Object.values(PREVIOUS_KEY).forEach((t) => {
      if (typeof o[t] == "string") {
        o[t] = { path: o[t] };
      }
    });

    Object.keys(PREVIOUS_KEY).forEach((t) => {
      if (o[t] === undefined || o[t] == null) {
        o[t] = "";
      } else if (typeof o[t] == "object" && typeof o[t].path == "string") {
        o[t] = o[t].path;
      }

      if (!o[PREVIOUS_KEY[t]]) {
        o[PREVIOUS_KEY[t]] = { path: o[t] };
      }
    });
  }
};

exports.migrateLocal = async (o) => {
  if (o && typeof o == "object") {
    Object.values(PREVIOUS_KEY).forEach((t) => {
      if (typeof o[t] == "string") {
        o[t] = { path: o[t] };
      }
    });

    Object.keys(PREVIOUS_KEY).forEach((t) => {
      if (typeof o[t] == "object" && typeof o[t].path == "string") {
        o[t] = o[t].path;
      }

      if (!o[PREVIOUS_KEY[t]] && o[t] !== undefined && o[t] != null) {
        o[PREVIOUS_KEY[t]] = { path: o[t] };
      }
    });
  }
};
