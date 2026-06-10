Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const EventEmitter = require("events").EventEmitter;
function default_1(e) {
  const r = new EventEmitter();

  r.on("route", ({ req, elapsedMS }) => {
    console.log(req.method, req.url, elapsedMS + "ms");
  });

  e.use((e, t, n) => {
    const o = Date.now();

    t.once("finish", () => {
      r.emit("route", { req: e, elapsedMS: Date.now() - o });
    });

    n();
  });
}
