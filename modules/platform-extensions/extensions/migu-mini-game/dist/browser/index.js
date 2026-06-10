Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;

const { join } = require("path");

const { existsSync } = require("fs-extra");

const share_1 = require("../share");
exports.methods = {
  async run(e, r) {
    e = join(e, "dist", r.name + ".rpk");
    return existsSync(e)
      ? (await Editor.Panel.open(share_1.PLATFORM_NAME + ".preview", e),
        Editor.Message.send(share_1.PLATFORM_NAME, "update-rpk-path", e),
        true)
      : (console.error(
          `migu rpk (${e}) does not exist, please build before preview!`
        ),
        false);
  },
};
