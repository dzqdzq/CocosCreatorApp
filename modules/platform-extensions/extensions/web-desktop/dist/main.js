Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.load = load;
exports.getPreviewUrl = getPreviewUrl;

const { join, basename } = require("path");

const { existsSync } = require("fs-extra");

const { setRootPath } = require("./server");

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
      r === "web-desktop") &&
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
async function getPreviewUrl(e, t = false) {
  var r = await Editor.Message.request("preview", "query-preview-url");
  var o = new URL(r);
  return t && o.protocol === "http:"
    ? `http://localhost:${await Editor.Message.request(
        "server",
        "query-port"
      )}/web-desktop/${e}/index.html`
    : r + `/web-desktop/${e}/index.html`;
}
exports.methods = {
  async preview(e, t = false) {
    setRootPath(e);

    Editor.Message.send(
      "program",
      "open-url",
      await getPreviewUrl(basename(e), t)
    );

    return true;
  },
  "set-preview-path"(e) {
    return !!existsSync(e) && (setRootPath(e), true);
  },
};
