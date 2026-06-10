Object.defineProperty(exports, "__esModule", { value: true });

exports.getExtensionDist = undefined;
exports.getExtensionDirPath = undefined;
exports.isEditorVersionError = undefined;
exports.getEditorVersion = undefined;
exports.isExtensionNameError = undefined;
exports.getFallbackExtensionName = undefined;
exports.getAuthor = undefined;
exports.TempProfileKeys = undefined;

const { join } = require("path");

const { valid, coerce, satisfies } = require("semver");

exports.TempProfileKeys = Object.freeze({
  author: "create_package_author",
  showInManager: "create_package_show_in_manager",
  showInFolder: "create_package_show_in_folder",
});

const DEFAULT_AUTHOR = "Cocos Creator";

const getAuthor = async () =>
  (await Editor.Profile.getTemp("extension", exports.TempProfileKeys.author)) ||
  DEFAULT_AUTHOR;

exports.getAuthor = getAuthor;
const invalidFolderNamePattern = /[<>:"|?*]/;

const extensionNamePattern =
  /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;

const getFallbackExtensionName = () => "extension-" + Date.now();

exports.getFallbackExtensionName = getFallbackExtensionName;

const isExtensionNameError = (e) =>
  invalidFolderNamePattern.test(e) ||
  !extensionNamePattern.test(e) ||
  /[.]/g.test(e);

exports.isExtensionNameError = isExtensionNameError;
const getEditorVersion = () => ">=" + Editor.App.version;
exports.getEditorVersion = getEditorVersion;

const isEditorVersionError = (e) =>
  !valid(coerce(e)) || satisfies(valid(coerce(e)) || "", "< 3.0.0");

exports.isEditorVersionError = isEditorVersionError;
const getExtensionDirPath = () => join(Editor.Project.path, "extensions");
exports.getExtensionDirPath = getExtensionDirPath;
const getExtensionDist = (e) => join((0, exports.getExtensionDirPath)(), e);

exports.getExtensionDist = getExtensionDist;
