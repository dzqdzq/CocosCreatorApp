Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.load = load;
exports.unload = unload;

const { removeCustomIcon } = require("../builder/customIcon");

function load() {}
function unload() {}
exports.methods = {
  async "builder-task-delete"(o, e) {
    await removeCustomIcon("custom", e.options.outputName);
  },
};
