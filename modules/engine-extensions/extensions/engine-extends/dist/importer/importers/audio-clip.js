Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioImporter = undefined;
const asset_db_1 = require("@editor/asset-db");
const utils_1 = require("../utils");
class AudioImporter extends asset_db_1.Importer {
  get version() {
    return "1.0.0";
  }
  get name() {
    return "audio-clip";
  }
  get assetType() {
    return "cc.AudioClip";
  }
  async import(o) {
    o.userData.downloadMode = 0;
    await o.copyToLibrary(o.extname, o.source);

    await new Promise((t, r) => {
      const a = document.createElement("audio");

      a.addEventListener("loadedmetadata", async () => {
        var e = this.createAudio(o, a.duration);
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
        var e = o.source
          .split(/\\|\//)
          .map((e) => encodeURIComponent(e))
          .join("/")
          .replace("%3A", ":");
        a.src = e;
      } catch (e) {
        r(e);
      }
    });

    return true;
  }
  createAudio(e, t) {
    var r = new cc.AudioClip();
    r._loadMode = e.userData.downloadMode;
    r._duration = t;
    r.name = e.basename;
    r._setRawAsset(e.extname);
    return r;
  }
}
exports.AudioImporter = AudioImporter;
