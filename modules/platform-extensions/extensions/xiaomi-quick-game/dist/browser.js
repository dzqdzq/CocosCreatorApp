Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;

const { join } = require("path");

const { existsSync } = require("fs-extra");

exports.methods = {
  async run(e, r) {
    r = r.packages["xiaomi-quick-game"];

    e = join(
      e,
      "dist",
      `${r.package}${r.useDebugKey ? ".debug." : ".release."}rpk`
    );

    return existsSync(e)
      ? (await Editor.Panel.open("xiaomi-quick-game.preview"),
        Editor.Message.send("xiaomi-quick-game", "update-rpk-path", e),
        true)
      : (console.error(
          `xiaomi rpk (${e}) does not exist, please build before preview!`
        ),
        false);
  },
};
