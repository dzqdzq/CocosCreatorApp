Object.defineProperty(exports, "__esModule", { value: true });
exports.patchOptionsToSettings = patchOptionsToSettings;
exports.getSplashSettings = getSplashSettings;
exports.getPhysicsConfig = getPhysicsConfig;
exports.formatSplashScreen = formatSplashScreen;
exports.checkSplash = checkSplash;

const { readFileSync } = require("fs-extra");

const { isEqual } = require("lodash");

const { join } = require("path");

const layerMask = [];
for (let e = 0; e <= 19; e++) {
  layerMask[e] = 1 << e;
}
async function patchOptionsToSettings(e, t) {
  t.launch.launchScene = e.startScene;
  t.engine.debug = e.debug;
  t.screen.designResolution = e.resolution;
  t.engine.platform = e.platform || t.engine.platform;
  t.assets.server = e.server || "";
  t.CocosEngine = Editor.App.version;

  t.engine.customLayers = e.customLayers.map((t) => {
    var e = layerMask.findIndex((e) => t.value === e);
    return { name: t.name, bit: e };
  });

  t.engine.customLayers.sort((e, t) => e.bit - t.bit);

  t.engine.sortingLayers = e.sortingLayers;

  var a = await Editor.Profile.getProject(
    "project",
    "general.renderPipeline",
    "default"
  );

  var a =
    ((t.rendering.renderPipeline =
      e.renderPipeline === a ? "" : e.renderPipeline),
    (t.rendering.customPipeline = e.customPipeline),
    (t.animation.customJointTextureLayouts =
      (await Editor.Message.request("project", "calc-joint-layout")) || []),
    e.includeModules.includes("custom-pipeline") &&
      (t.rendering.effectSettingsPath = "src/effect.bin"),
    (t.splashScreen = await getSplashSettings(
      !!e.useSplashScreen,
      !!e.preview
    )),
    (t.physics = await getPhysicsConfig(e.includeModules, e.physicsConfig)),
    (t.engine.macros = e.macroConfig || {}),
    await Editor.Profile.getProject(
      "project",
      "general.downloadMaxConcurrency"
    ));

  t.assets.downloadMaxConcurrency = a || 15;
}
async function getSplashSettings(e, t) {
  var a = await Editor.Profile.getProject(
    "builder",
    "splash-setting",
    "default"
  );
  let r = await Editor.Profile.getProject("builder", "splash-setting");
  if (e === false && !t) {
    e = formatSplashScreen(a);

    if (await checkSplash("removeSplash")) {
      e.totalTime = 0;
      delete e.logo;
      delete e.background;
    } else {
      console.warn(Editor.I18n.t("builder.warn.invalidRemoveSplash"));
    }

    return e;
  }
  try {
    let e = true;

    if (!t && !isEqual(a, r) && !(await checkSplash("customSplash"))) {
      console.warn(Editor.I18n.t("builder.warn.invalidCustomSplash"));
      e = false;
    }

    return r && e
      ? formatSplashScreen((r = Object.assign({}, a, r)))
      : formatSplashScreen(a);
  } catch (e) {
    console.error(e);

    console.error(
      Editor.I18n.t("builder.error.missingSplashTips", {
        splashScreen: JSON.stringify(r),
      })
    );

    return formatSplashScreen(a);
  }
}
async function getPhysicsConfig(t, e) {
  let a = "";
  var r = [
    "physics-cannon",
    "physics-ammo",
    "physics-builtin",
    "physics-physx",
  ];
  for (let e = 0; e < r.length; e++) {
    if (t.includes(r[e])) {
      a = r[e];
      break;
    }
  }
  return Object.assign({ physicsEngine: a }, e);
}
function formatSplashScreen(e) {
  var t;

  if (e.logo) {
    e.logo.type === "custom"
      ? ((t = Editor.UI.__protected__.File.resolveToRaw(e.logo.image)),
        (e.logo.base64 =
          "data:image/png;base64," + readFileSync(t).toString("base64")))
      : e.logo.type === "default" &&
        ((t = join(
          Editor.App.path,
          "builtin/builder/static/logo/logo.png"
        ).replace("app.asar", "app.asar.unpacked")),
        (e.logo.base64 =
          "data:image/png;base64," + readFileSync(t).toString("base64")));

    delete e.logo.image;
  }

  if (e.background) {
    e.background.type === "custom"
      ? ((t = Editor.UI.__protected__.File.resolveToRaw(e.background.image)),
        (e.background.base64 =
          "data:image/png;base64," + readFileSync(t).toString("base64")),
        delete e.background.color)
      : e.background.type === "default" &&
        (e.background.color = {
          x: 4 / 255,
          y: 9 / 255,
          z: 10 / 255,
          w: 1 / 255,
        });

    delete e.background.image;
  }

  return e;
}
async function checkSplash(e) {
  if (e) {
    try {
      var t = await Editor.Message.request(
        "information",
        "query-information",
        e
      );
      if (
        await Editor.Profile.getProject(
          "information",
          `information.${e}.passByNetworkFailure`
        )
      ) {
        await Editor.Profile.removeProject(
          "information",
          `information.${e}.passByNetworkFailure`
        );

        return true;
      }
      if (t && t.data && t.data.enable && !t.data[t.data.id].complete) {
        return false;
      }
    } catch (e) {
      console.debug(e);
    }
  }
  return true;
}
