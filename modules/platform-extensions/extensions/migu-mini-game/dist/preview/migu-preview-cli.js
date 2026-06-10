Object.defineProperty(exports, "__esModule", { value: true });
exports.previewManager = undefined;

const { dirname } = require("path");

const { existsSync } = require("fs");

const share_1 = require("../share");
const express = require("express");
const app = express();
class PreviewManager {
  isOpen = false;
  async run(e, a) {
    var r;
    var o;
    var t;

    if (this.isOpen) {
      console.warn(
        "migu multiple preview services are enabled, turn off others!"
      );
    } else if (existsSync(e)) {
      r = dirname(e);
      app.use(express.static(r));
      o = await Editor.Message.request("preview", "get-preview-ip");
      t = await Editor.Network.getFreePort(7456);

      app
        .listen(t, o, async () => {
          console.log(`migu server listening at http://${o}:` + t);

          var e = await Editor.Profile.getConfig(
            share_1.PLATFORM_NAME,
            "builder"
          );

          var r = `http://${o}:` + t + `/${e?.common.name}.rpk`;
          var s = "youplay://cocosgame?";

          s =
            (s += "gameId=" + e?.options[share_1.PLATFORM_NAME].package) +
            ("&gameName=" + e?.common.name);

          var i =
            e?.options[share_1.PLATFORM_NAME].deviceOrientation === "portrait"
              ? 1
              : 0;

          var i =
            ((s =
              (s += "&portrait=" + i) +
              ("&versionCode=" +
                e?.options[share_1.PLATFORM_NAME].versionCode)),
            e?.options[share_1.PLATFORM_NAME].isSubpackage ? 1 : 0);

          var s = s + ("&hasSubpackage=" + i) + ("&mainUrl=" + r);
          this.isOpen = true;
          a(null, s);
        })
        .on("error", (e) => {
          console.error("migu server failed to start:", e);
          this.isOpen = false;
          a(e);
        });
    } else {
      console.error(
        `migu rpk (${e}) does not exist, please build before preview!`
      );
    }
  }
  kill() {
    this.isOpen = false;
  }
}
exports.previewManager = new PreviewManager();
