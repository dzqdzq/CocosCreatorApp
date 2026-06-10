const join = require("path").join;
const { existsSync, outputJSONSync } = require("fs-extra");
exports.migrateGlobal = async (e) => {
  var t = join(Editor.App.home, "profiles", Editor.App.version, "./packages");
  var t = join(t, "./preferences.json");
  if (existsSync(t)) {
    try {
      var r = require(t);

      if (
        r.native &&
        (r.native.wechatgame_app_path &&
          (e.wechat_devtools = r.native.wechatgame_app_path),
        r.native.android_sdk_root &&
          (e.android_sdk = r.native.android_sdk_root),
        r.native.android_ndk_root &&
          (e.android_ndk = r.native.android_ndk_root),
        r.native.bytedance_app_path)
      ) {
        e.bytedance_devtools = r.native.bytedance_app_path;
      }

      if (
        r.edit &&
        (r.edit.script_editor && (e.script_editor = r.edit.script_editor),
        r.edit.preview_browser)
      ) {
        e.browser = r.edit.preview_browser;
      }
    } catch (e) {
      console.error(e);
    }
  }
};
