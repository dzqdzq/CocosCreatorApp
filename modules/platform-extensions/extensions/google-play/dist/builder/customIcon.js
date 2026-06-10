var __importDefault =
  (this && this.__importDefault) ||
  ((t) => (t && t.__esModule ? t : { default: t }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.ICON_DPI_LIST = undefined;
exports.getDisplayCustomIcon = getDisplayCustomIcon;
exports.saveCustomIcon = saveCustomIcon;
exports.getCustomIconInfo = getCustomIconInfo;
exports.removeCustomIcon = removeCustomIcon;
const sharp_1 = __importDefault(require("sharp"));

const { existsSync, ensureDir, remove } = require("fs-extra");

const { join, dirname } = require("path");

const SETTING_ROOT = join(Editor.Project.path, "settings/icons");
function getCustomIconInfoImpl(t, e) {
  let a = "";
  switch (t) {
    case "default": {
      a = join(__dirname, "../../static/icons");
      break;
    }
    case "custom": {
      a = join(SETTING_ROOT, e);
    }
  }
  let i = "";
  var o = Object.keys(exports.ICON_DPI_LIST).map((t) => {
    var e = t;
    var o = "ic_launcher.png";
    var s = join(a, e, o);

    if (t === "mipmap-xxxhdpi") {
      i = s + "?timestamp=" + Date.now();
    }

    return { dirName: e, fileName: o, dpi: exports.ICON_DPI_LIST[t], path: s };
  });
  return { type: t, display: i, list: o };
}
function hasCustomIcon(t) {
  return existsSync(t.list[0].path);
}
function getDisplayCustomIcon(t, e) {
  t = getCustomIconInfoImpl(t, e);
  return (hasCustomIcon(t) ? t : getCustomIconInfoImpl("default", e)).display;
}
async function saveCustomIcon(t, e, o) {
  e = getCustomIconInfoImpl(e, o);
  for (const s of e.list) {
    await ensureDir(dirname(s.path));

    await (0, sharp_1.default)(t)
      .resize(s.dpi, s.dpi, { fit: "inside" })
      .withMetadata({ density: s.dpi })
      .toFile(s.path);
  }
  return e.display;
}
function getCustomIconInfo(t, e) {
  t = getCustomIconInfoImpl(t, e);
  return hasCustomIcon(t) ? t : getCustomIconInfoImpl("default", e);
}
async function removeCustomIcon(t, e) {
  if (t !== "default") {
    try {
      await remove(join(SETTING_ROOT, e));
    } catch (t) {}
  }
}
exports.ICON_DPI_LIST = {
  "mipmap-mdpi": 48,
  "mipmap-hdpi": 72,
  "mipmap-xhdpi": 96,
  "mipmap-xxhdpi": 144,
  "mipmap-xxxhdpi": 192,
};
