Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.load = load;
exports.unload = unload;
const express_1 = require("./express");

const { startup, stop, getPort } = express_1;

const plugin_1 = require("./plugin");

const { sortIp, scan } = require("./utils");

async function load() {
  var e;
  Editor.Package.getPackages({ enable: true }).forEach(plugin_1.attach);
  Editor.Package.__protected__.on("enable", plugin_1.attach);
  Editor.Package.__protected__.on("disable", plugin_1.detach);

  if (!(await Editor.Profile.getConfig("server", "server_port", "local"))) {
    e =
      (await Editor.Profile.getConfig("server", "server_port", "global")) ||
      7456;

    await Editor.Profile.setConfig("server", "server_port", e, "local");
  }

  startup();
}
function unload() {
  stop();
}
exports.methods = {
  queryPort() {
    return getPort();
  },
  queryHTTPSEnabled: express_1.queryHTTPSEnabled,
  queryIPList() {
    return Editor.Network.queryIPList();
  },
  querySortIpList() {
    var e = Editor.Network.queryIPList();
    return sortIp(e);
  },
  async scanLAN() {
    return (await scan()).filter(Boolean);
  },
  async "change-preview-port"(e, r) {
    if (getPort() !== r) {
      Editor.Task.addNotice({
        title: Editor.I18n.t("server.server_port_change_tips"),
        source: "server",
      });
    }
  },
  async "change-https-options"(e, r) {
    if (
      e === "enable" ||
      (await Editor.Profile.getConfig("server", "https.enable"))
    ) {
      Editor.Task.addNotice({
        title: Editor.I18n.t("server.https.change_tips"),
        source: "server",
      });
    }
  },
};
