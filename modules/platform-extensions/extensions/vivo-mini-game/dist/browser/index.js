Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;

const { join } = require("path");

const { existsSync } = require("fs-extra");

exports.methods = {
  async run(e, r) {
    r = r.packages["vivo-mini-game"];

    e = join(e, "dist", `${r.package}${r.useDebugKey ? "." : ".signed."}rpk`);

    return existsSync(e)
      ? (await Editor.Panel.open("vivo-mini-game.preview", e),
        Editor.Message.send("vivo-mini-game", "update-rpk-path", e),
        true)
      : (console.error(
          `vivo rpk (${e}) does not exist, please build before preview!`
        ),
        false);
  },
};
