Object.defineProperty(exports, "__esModule", { value: true });
exports.throwError = undefined;
exports.onAfterInit = onAfterInit;
exports.onAfterBundleInit = onAfterBundleInit;
exports.onAfterBuildAssets = onAfterBuildAssets;
exports.onBeforeCompressSettings = onBeforeCompressSettings;
exports.onAfterBuild = onAfterBuild;

const { ensureDirSync, copyFileSync, writeFileSync } = require("fs-extra");

const { join } = require("path");

const cc_1 = require("cc");

const { executableNameOrDefault } = require("./utils");

async function onAfterInit(e, t, a) {
  const o = (e.packages.ios.renderBackEnd = {
    gles2: false,
    gles3: false,
    metal: true,
  });

  const e_cocosParams = e.cocosParams;
  Object.keys(o).forEach((e) => {
    e_cocosParams.cMakeConfig["CC_USE_" + e.toUpperCase()] = o[e];
  });
  var s;
  var r = e.packages.ios;
  e_cocosParams.platformParams.orientation = e.packages.ios.orientation;
  e_cocosParams.platformParams.bundleId = e.packages.ios.packageName;
  e_cocosParams.cMakeConfig.MACOSX_BUNDLE_GUI_IDENTIFIER = `set(MACOSX_BUNDLE_GUI_IDENTIFIER ${e_cocosParams.packageName})`;

  if (r.developerTeam) {
    s = r.developerTeam.split("_")[0];
    e_cocosParams.cMakeConfig.DEVELOPMENT_TEAM = `set(DEVELOPMENT_TEAM ${s})`;
    e_cocosParams.platformParams.teamid = s;
  }

  e_cocosParams.cMakeConfig.TARGET_IOS_VERSION = `set(TARGET_IOS_VERSION ${
    r.targetVersion || "12.0"
  })`;

  e_cocosParams.cMakeConfig.USE_PORTRAIT = !!r.orientation.portrait;
  e_cocosParams.cMakeConfig.CUSTOM_COPY_RESOURCE_HOOK =
    r.skipUpdateXcodeProject;
  e_cocosParams.platformParams.skipUpdateXcodeProject =
    r.skipUpdateXcodeProject;

  e_cocosParams.executableName = executableNameOrDefault(
    e_cocosParams.projectName,
    e.packages.ios.executableName
  );

  if (e_cocosParams.executableName === "CocosGame") {
    console.warn(
      `The provided project name "${e_cocosParams.projectName}" is not suitable for use as an executable name. 'CocosGame' is applied instead.`
    );
  }

  e_cocosParams.cMakeConfig.CC_EXECUTABLE_NAME = `set(CC_EXECUTABLE_NAME "${e_cocosParams.executableName}")`;

  if (
    r.osTarget &&
    (r.osTarget.simulator !== undefined &&
      (e_cocosParams.platformParams.simulator = r.osTarget.simulator),
    r.osTarget.iphoneos !== undefined)
  ) {
    e_cocosParams.platformParams.iphoneos = r.osTarget.iphoneos;
  }

  t.staticsInfo.B100005 = e.packages.ios.packageName;
  t.staticsInfo.B100011 = e.packages.ios.orientation;
}
async function onAfterBundleInit(e) {
  var t = (e.packages.ios.renderBackEnd = {
    gles2: false,
    gles3: false,
    metal: true,
  });
  e.assetSerializeOptions["cc.EffectAsset"].glsl1 = t.gles2 ?? true;
  e.assetSerializeOptions["cc.EffectAsset"].glsl3 = t.gles3 ?? true;
  e.assetSerializeOptions["cc.EffectAsset"].glsl4 = t.metal ?? true;
}
async function onAfterBuildAssets(e, t, a) {
  if (!e.useSplashScreen) {
    e.useSplashScreen = true;
  }
}
async function onBeforeCompressSettings(e, t, a) {
  if (t.settings.splashScreen) {
    t.settings.splashScreen.totalTime = 0;
  }
}
async function onAfterBuild(e, t) {
  await buildSplash(e, t);
}
async function buildSplash(e, t) {
  var a = t.settings.splashScreen;
  if (a && a.logo && a.background) {
    var o = join(Editor.Project.path, "native/engine/ios");

    ensureDirSync(o);

    var i = [
      {
        width: 1242,
        height: 2208,
        outputPath: join(o, "LaunchScreenBackgroundPortrait.png"),
      },
      {
        width: 2208,
        height: 1242,
        outputPath: join(o, "LaunchScreenBackgroundLandscape.png"),
      },
    ];

    try {
      for (const r of i) {
        await generateSplashPicture(r, a, t.settings.screen.designResolution);
      }
      var s = e.packages.ios.orientation.portrait
        ? join(o, "LaunchScreenBackgroundPortrait.png")
        : join(o, "LaunchScreenBackgroundLandscape.png");

      copyFileSync(s, join(o, "LaunchScreenBackground.png"));

      console.debug(
        "Generate splash to:",
        join(o, "LaunchScreenBackgroundPortrait.png")
      );
    } catch (e) {
      console.warn("Failed to generate splash:", e);
    }
  }
}
async function generateSplashPicture(e, a, o) {
  var i = document.createElement("canvas");
  i.width = e.width;
  i.height = e.height;
  var s = i.getContext("2d");
  if (a.background?.type === "custom" && a.background.base64) {
    var o = o.policy;
    var r = new Image();
    r.src = a.background.base64;
    await c(r);
    Math.max(i.width / r.width, i.height / r.height);
    let e;
    let t;
    t =
      o === cc_1.ResolutionPolicy.FIXED_HEIGHT
        ? ((e = (r.width * i.height) / r.height), i.height)
        : o === cc_1.ResolutionPolicy.FIXED_WIDTH
        ? ((e = i.width), (r.height * i.width) / r.width)
        : o === cc_1.ResolutionPolicy.SHOW_ALL
        ? r.width / r.height > i.width / i.height
          ? ((e = i.width), (r.height * i.width) / r.width)
          : ((e = (r.width * i.height) / r.height), i.height)
        : o === cc_1.ResolutionPolicy.NO_BORDER
        ? r.width / r.height > i.width / i.height
          ? ((e = (r.width * i.height) / r.height), i.height)
          : ((e = i.width), (r.height * i.width) / r.width)
        : ((e = i.width), i.height);
    var o = (i.width - e) / 2;
    var n = (i.height - t) / 2;
    s.beginPath();
    s.rect(o, n, e, t);
    s.closePath();
    s.clip();
    s.drawImage(r, o, n, e, t);
  } else {
    if (a.background?.type === "color" && a.background.color) {
      r = a.background.color;

      s.fillStyle = `rgba(${255 * r.x}, ${255 * r.y}, ${255 * r.z}, ${
        255 * r.w
      })`;
    } else {
      s.fillStyle = "rgba(4, 9, 10, 1)";
    }

    s.fillRect(0, 0, i.width, i.height);
  }
  if (
    (a.logo?.type === "custom" || a.logo?.type === "default") &&
    a.logo.base64
  ) {
    var o = new Image();
    o.src = a.logo.base64;
    await c(o);
    var n = o.height / o.width;
    var r = 0.185 * i.height * a.displayRatio;
    var n = r / n;
    var t = (i.width - n) / 2;
    let e = (i.height * (5 / 6) - r) / 2;

    if (r > i.height * (5 / 6)) {
      e = (i.height - r) / 2;
    }

    s.drawImage(o, t, e, n, r);

    if (a.logo.type === "default") {
      s.font = "400 36px Arial";
      s.textBaseline = "top";
      s.textAlign = "center";
      s.fillStyle = "rgba(250, 250, 250, 0.4)";
      s.lineWidth = 2;
      s.strokeStyle = "rgba(5, 5, 5, 0.3)";
      s.strokeText("Created with Cocos", i.width / 2, e + r + 48);
      s.fillText("Created with Cocos", i.width / 2, e + r + 48);
    }
  }
  o = i.toDataURL("image/png");
  t = atob(o.split(",")[1]);
  function c(a) {
    return new Promise((e, t) => {
      if (a.complete) {
        e(a);
      } else {
        a.addEventListener("load", () => {
          e(a);
        });

        a.addEventListener("error", (e) => {
          t(e);
        });
      }
    });
  }
  writeFileSync(e.outputPath, t, "binary");
  console.log("Generate splash to:", e.outputPath);
}
exports.throwError = true;
