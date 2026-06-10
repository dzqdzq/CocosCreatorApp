Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoHandler = undefined;
const cc_1 = require("cc");

const { getDependUUIDList } = require("../utils");

function loadVideo(o, a) {
  return new Promise((e, r) => {
    a.addEventListener("loadedmetadata", async () => {
      e();
    });

    a.addEventListener("error", (e) => {
      r(e);
    });

    try {
      var t = o.source
        .split(/\\|\//)
        .map((e) => encodeURIComponent(e))
        .join("/")
        .replace("%3A", ":");
      a.src = t;
    } catch (e) {
      r(e);
    }
  });
}
function createVideo(e, r) {
  var t = new cc_1.VideoClip();

  if (r) {
    t._duration = r;
  }

  t.name = e.basename;
  t._setRawAsset(e.extname);
  return t;
}

exports.VideoHandler = {
  name: "video-clip",
  assetType: cc_1.js.getClassName(cc_1.VideoClip),
  importer: {
    version: "1.0.0",
    async import(r) {
      await r.copyToLibrary(r.extname, r.source);
      var e = document.createElement("video");
      try {
        await loadVideo(r, e);
      } catch (e) {
        console.error(
          `Loading video ${r.source} failed, the video you are using may be in a corrupted format or not supported by the current browser version of the editor, in the latter case you can ignore this error.`
        );

        console.debug(e);
      }
      e = createVideo(r, e.duration);
      e = EditorExtends.serialize(e);
      await r.saveToLibrary(".json", e);
      e = getDependUUIDList(e);
      r.setData("depends", e);
      return true;
    },
  },
};

exports.default = exports.VideoHandler;
