Object.defineProperty(exports, "__esModule", { value: true });
exports.unload = undefined;
exports.load = undefined;
exports.methods = undefined;
const utils_1 = require("../builder/utils");
async function load() {
  if (process.platform === "darwin") {
    await exports.methods.queryTeamInfo();
  }
}
function unload() {}

exports.methods = {
  async queryTeamInfo() {
    var o = await utils_1.findSignIdentify();

    if (o.length) {
      Editor.Profile.setConfig("ios", "teamsInfo", o, "global");
    }

    return o;
  },
};

exports.load = load;
exports.unload = unload;
