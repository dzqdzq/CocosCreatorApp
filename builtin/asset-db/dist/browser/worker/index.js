Object.defineProperty(exports, "__esModule", { value: true });
exports.init = init;
exports.startDatabase = startDatabase;
exports.debug = debug;
exports.reload = reload;
exports.forwarding = forwarding;
const tasks_1 = require("./tasks");

const { getWorker } = tasks_1;

async function init() {
  tasks_1.depend.execute("worker-init");
  tasks_1.depend.execute("engine-info");
}
function startDatabase(e) {}
function debug() {
  var e = getWorker();

  if (e) {
    e.debug(true);
  }
}
function reload() {
  var e = getWorker();

  if (e) {
    e.win.reload();
  }
}
async function forwarding(e, ...t) {
  var r = getWorker();
  return r ? r.send(e, ...t) : null;
}

if (Editor.Startup.__protected__.ready.package) {
  tasks_1.depend.finish("editor-init");
} else {
  Editor.Startup.__protected__.once("package-ready", () => {
    tasks_1.depend.finish("editor-init");
  });
}
