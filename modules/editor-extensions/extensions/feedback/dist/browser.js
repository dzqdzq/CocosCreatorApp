async function load() {}
function unload() {}
Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.load = load;
exports.unload = unload;

exports.methods = {
  async open() {
    Editor.Panel.open("feedback");
  },
};
