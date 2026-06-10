var __importDefault =
  (this && this.__importDefault) ||
  ((t) => (t && t.__esModule ? t : { default: t }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.LastImportFolderPath = undefined;
const fs_extra_1 = __importDefault(require("fs-extra"));
const utils_1 = require("../../public/utils");
const key = "last-import-folder-path";
function getValue() {
  return Editor.Profile.getConfig(utils_1.INTERNAL_EXTENSION_NAME, key);
}
function setValue(t) {
  return Editor.Profile.setConfig(
    utils_1.INTERNAL_EXTENSION_NAME,
    key,
    t,
    "global"
  );
}
async function tryGet() {
  let e;
  try {
    if ("string" != typeof (e = await getValue())) {
      return null;
    }
  } catch (t) {
    if (Editor.App.dev) {
      console.warn(t);
    }

    return null;
  }
  try {
    if (!(await fs_extra_1.default.stat(e)).isDirectory()) {
      return null;
    }
  } catch (t) {
    if (Editor.App.dev) {
      console.warn(t);
      console.warn(`Invalid import folder path: "${e}"`);
    }

    return null;
  }
  return e;
}
async function trySet(t) {
  try {
    return setValue(t);
  } catch (t) {
    console.warn(t);

    console.warn(
      `Failed to save profile "${utils_1.INTERNAL_EXTENSION_NAME}.${key}"`
    );
  }
}

exports.LastImportFolderPath = {
  get: getValue,
  set: setValue,
  tryGet,
  trySet,
};

exports.default = exports.LastImportFolderPath;
