function load() {}
function unload() {}
Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.load = load;
exports.unload = unload;

exports.methods = {
  async installExtension(e) {
    if (await Editor.Panel.has("extension.manager")) {
      Editor.Message.send("extension", "search", e);
    } else {
      Editor.Panel.open("extension.manager", { search: e });
    }
  },
};
