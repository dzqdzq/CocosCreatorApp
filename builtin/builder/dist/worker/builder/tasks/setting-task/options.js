Object.defineProperty(exports, "__esModule", { value: true });
exports.title = undefined;
exports.handle = handle;

const {
  patchOptionsToSettings,
  formatSplashScreen,
} = require("./utils/project-options");

const { isEqual } = require("lodash");

exports.title = "i18n:builder.tasks.settings.options";
const layerMask = [];
for (let t = 0; t <= 19; t++) {
  layerMask[t] = 1 << t;
}
async function handle(t, e, s) {
  await patchOptionsToSettings(t, e.settings);
  await postSplashSettingsMetric(e);
}
async function postSplashSettingsMetric(t) {
  var e = t.settings.splashScreen;

  var s = formatSplashScreen(
    await Editor.Profile.getProject("builder", "splash-setting", "default")
  );

  let o = 2;

  if (e?.totalTime === 0) {
    o = 3;
  } else if (!isEqual(s, e)) {
    o = 1;
  }

  t.staticsInfo.B100039 = o;
}
