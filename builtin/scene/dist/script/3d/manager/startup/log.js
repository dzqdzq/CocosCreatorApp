var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });

const { ignoreStack } = require("v-stacks");

let prefix = "Scene";
const electron_logger_1 = __importDefault(require("@base/electron-logger"));
electron_logger_1.default.setLevel(4);

electron_logger_1.default.setLogHandler((e) => {
  var t;
  e.message = `[${prefix}] ` + e.message;

  if (
    (e.type === "warn" || e.type === "error") &&
    (!e.stack || e.stack.length === 0)
  ) {
    t = new Error(e.message);
    e.stack = ignoreStack(t.stack, 3);
  }
});

class Logger {
  changePrefix(e) {
    prefix = e;
  }
  setLevel(e) {
    electron_logger_1.default.setLevel(e);
  }
  init() {
    process.on("uncaughtException", (e) => {
      console.error(e);
    });
  }
}
exports.default = new Logger();
