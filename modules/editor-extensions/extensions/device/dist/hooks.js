Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.queryDefaultDevice = queryDefaultDevice;

const { readJSONSync } = require("fs-extra");

const { join } = require("path");

const sentry_1 = require("@editor/sentry");
async function register(e) {
  try {
    await registerDeviceConfig(e);
  } catch (e) {
    console.error(e);
  }
}
async function registerDeviceConfig(e) {
  var e = e.contributions.profile.editor;
  var t = (await queryDefaultDevice()).deviceConfig;
  await Editor.Profile.setConfig("device", "deviceConfig", t, "default");
  const i = {};

  t.forEach((e) => {
    if (
      e.name &&
      typeof e.width == "number" &&
      typeof e.height == "number" &&
      typeof e.ratio == "number"
    ) {
      if (e.enable) {
        i[e.name] = true;
      }
    } else {
      console.warn("Invalid device data " + JSON.stringify(e));
    }
  });

  e.deviceConfig.default = t;
  e.enableDevice.default = i;
  await Editor.Profile.setConfig("device", "enableDevice", i, "default");
}
async function queryDefaultDevice() {
  var e = "device-list";
  let t = false;
  let i = [];
  console.log("Request namespace: " + e);
  try {
    var r = (await Editor.Profile.getConfig("device", "releaseKey")) || "";

    var a = await Editor.Network.get(
      `https://config.cocos.com/configs/creator-settings/default/${e}?releaseKey=` +
        r
    );

    var o = JSON.parse(a.toString());
    i = JSON.parse(o.configurations.list);
    t = r === o.releaseKey;
    Editor.Profile.setConfig("device", "releaseKey", o.releaseKey, "global");
  } catch (e) {
    sentry_1.sentry.captureException(e);
  }
  return {
    deviceConfig: (i =
      i && i.length !== 0
        ? i
        : readJSONSync(join(__dirname, "../static/devices.json"))),
    dirty: t,
  };
}
