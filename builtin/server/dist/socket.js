Object.defineProperty(exports, "__esModule", { value: true });
exports.start = start;
exports.getSocket = getSocket;
exports.disconnect = disconnect;
const plugin_1 = require("./plugin");
const io = require("socket.io");
let app = null;
async function start(t) {
  (app = io(t)).on("connection", (e) => {
    plugin_1.socketArray.forEach((t) => {
      t.connection(e);
    });

    e.on("disconnect", () => {
      plugin_1.socketArray.forEach((t) => {
        t.disconnect(e);
      });
    });
  });
}
function getSocket() {
  return app;
}
function disconnect() {
  app?.disconnect();
}
