Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;

exports.methods = {
  async open(e) {
    if (await Editor.Panel.has("console")) {
      Editor.Panel.focus("console");
      Editor.Message.send("console", "refresh");
    } else {
      Editor.Panel.open("console", e);
    }
  },
  async "refresh-panel"() {
    if (await Editor.Panel.has("console")) {
      Editor.Message.send("console", "refresh");
    }
  },
  openDocs() {
    Editor.Message.send(
      "program",
      "open-url",
      Editor.Utils.Url.getDocUrl("editor/console/")
    );
  },
  openSetting() {
    Editor.Message.request("preferences", "open-settings", "console");
  },
  clear() {
    Editor.Logger.clear();
  },
};
