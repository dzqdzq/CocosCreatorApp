function load() {}
function unload() {}
Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.load = load;
exports.unload = unload;

exports.methods = {
  upload() {
    Editor.Panel.open("channel-upload-tools", "huawei-agc");
  },
};
