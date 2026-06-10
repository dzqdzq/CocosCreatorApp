Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.load = load;
exports.unload = unload;

const { findSignIdentify } = require("../builder/utils");

async function load() {}
function unload() {}
exports.methods = {
  async queryTeamInfo() {
    var e = await findSignIdentify();

    if (e.length) {
      Editor.Profile.setConfig("ios", "teamsInfo", e, "global");
    }

    return e;
  },
};
