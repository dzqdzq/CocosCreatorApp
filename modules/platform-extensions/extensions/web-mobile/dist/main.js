Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.load = load;

const { join, basename } = require("path");

const { existsSync } = require("fs-extra");

const { setRootPath } = require("./server");

const { getPreviewUrl } = require("./utils");

const lodash = require("lodash");
async function load() {
  setPreviewPathFromTask().catch((e) => {
    console.error(e);
  });
}
async function setPreviewPathFromTask() {
  var e =
    (await Editor.Profile.getConfig("builder", "BuildTaskManager.taskMap")) ||
    {};
  Object.values(e).forEach((e) => {
    var t;
    var r;

    if (
      e.progress === 1 &&
      ((r = lodash.get(e, "options.platform")),
      (t = lodash.get(e, "options.buildPath")),
      r === "web-mobile") &&
      typeof t == "string"
    ) {
      r = join(
        Editor.UI.__protected__.File.resolveToRaw(t),
        e.options.outputName
      );
      setRootPath(r);
    }
  });
}
exports.methods = {
  async preview(e, t = false) {
    setRootPath(e);
    e = await getPreviewUrl(basename(e), t);
    Editor.Message.send("program", "open-url", e);
    return e;
  },
  async "set-preview-path"(e) {
    setRootPath(e);
    var t = await getPreviewUrl(basename(e));
    existsSync(e);
    return t;
  },
};
