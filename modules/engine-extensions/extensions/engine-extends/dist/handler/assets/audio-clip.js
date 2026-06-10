Object.defineProperty(exports, "__esModule", { value: true });

const { getDependUUIDList } = require("../utils");

const AudioHandler = {
  name: "audio-clip",
  assetType: "cc.AudioClip",
  importer: {
    version: "1.0.0",
    async import(o) {
      o.userData.downloadMode = 0;
      await o.copyToLibrary(o.extname, o.source);

      await new Promise((a, t) => {
        const r = document.createElement("audio");

        r.addEventListener("loadedmetadata", async () => {
          var e = createAudio(o, r.duration);
          var e = EditorExtends.serialize(e);

          var e = (await o.saveToLibrary(".json", e), getDependUUIDList(e));

          o.setData("depends", e);
          a();
        });

        r.addEventListener("error", (e) => {
          t(e);
        });

        try {
          var e = o.source
            .split(/\\|\//)
            .map((e) => encodeURIComponent(e))
            .join("/")
            .replace("%3A", ":");
          r.src = e;
        } catch (e) {
          t(e);
        }
      });

      return true;
    },
  },
};

function createAudio(e, a) {
  var t = new cc.AudioClip();
  t._loadMode = e.userData.downloadMode;
  t._duration = a;
  t.name = e.basename;
  t._setRawAsset(e.extname);
  return t;
}
exports.default = AudioHandler;
