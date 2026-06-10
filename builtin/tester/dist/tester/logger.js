Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = undefined;
const EventEmitter = require("events").EventEmitter;
class Logger extends EventEmitter {
  log(e) {
    this.emit("print", { type: "log", message: e });
  }
  error(e) {
    if (typeof e == "string") {
      this.emit("print", { type: "error", message: e });
    } else {
      this.emit("print", {
        type: "error",
        message: e.message,
        stack: e.stack,
      });
    }
  }
  rollback() {
    this.emit("rollback");
  }
}
exports.logger = new Logger();
