Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoImporter = undefined;
const asset_db_1 = require("@editor/asset-db");
const cc_1 = require("cc");
const utils_1 = require("../utils");
class VideoImporter extends asset_db_1.Importer {
  get version() {
    return "1.0.0";
  }
  get name() {
    return "video-clip";
  }
  get assetType() {
    return cc_1.js.getClassName(cc_1.VideoClip);
  }
  async import(o) {
    await o.copyToLibrary(o.extname, o.source);

    await new Promise((t, r) => {
      const a = document.createElement("video");
      var e = document.createElement("source");
      a.appendChild(e);

      a.addEventListener("loadedmetadata", async () => {
        var e = this.createVideo(o, a.duration);
        var e = EditorExtends.serialize(e);

        var e =
          (await o.saveToLibrary(".json", e), utils_1.getDependUUIDList(e));

        o.setData("depends", e);
        t();
      });

      a.addEventListener("error", (e) => {
        r(e);
      });

      try {
        var s = o.source
          .split(/\\|\//)
          .map((e) => encodeURIComponent(e))
          .join("/")
          .replace("%3A", ":");
        e.src = s;
      } catch (e) {
        r(e);
      }
    });

    return true;
  }
  createVideo(e, t) {
    var r = new cc_1.VideoClip();
    r._duration = t;
    r.name = e.basename;
    r._setRawAsset(e.extname);
    return r;
  }
}
exports.VideoImporter = VideoImporter;
