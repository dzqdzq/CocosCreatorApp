Object.defineProperty(exports, "__esModule", { value: true });
exports.previewManager = undefined;

const { dirname } = require("path");

const { existsSync } = require("fs");

const share_1 = require("../share");
const express = require("express");
const app = express();
class PreviewManager {
  isOpen = false;
  async run(e, r) {
    if (this.isOpen) {
      console.warn(
        "honor multiple preview services are enabled, turn off others!"
      );
    } else if (existsSync(e)) {
      var s = dirname(e);
      app.use(express.static(s));
      const i = await Editor.Message.request("preview", "get-preview-ip");
      const t = await Editor.Network.getFreePort(7456);
      app
        .listen(t, i, async () => {
          console.log(`honor server listening at http://${i}:` + t);

          var e = await Editor.Profile.getConfig(
            share_1.PLATFORM_NAME,
            "builder"
          );

          var e =
            `http://${i}:` +
            t +
            `/${e?.options[share_1.PLATFORM_NAME].package}.rpk`;

          this.isOpen = true;
          r(null, e);
        })
        .on("error", (e) => {
          console.error("honor server failed to start:", e);
          this.isOpen = false;
          r(e);
        });
    } else {
      console.error(
        `honor rpk (${e}) does not exist, please build before preview!`
      );
    }
  }
  kill() {
    this.isOpen = false;
  }
}
exports.previewManager = new PreviewManager();
