var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackerDriverLogger = undefined;
const winston_1 = __importDefault(require("winston"));

const { getGlobal } = require("@electron/remote");

const remoteEditor = getGlobal("Editor");
const packerDriverLogTag = "::PackerDriver::";
const packerDriverLogTagRegex = new RegExp(packerDriverLogTag);
const packerDriverLogTagHidden = `{hidden(${packerDriverLogTag})}`;
class PackerDriverLogger {
  constructor(e) {
    e = winston_1.default.createLogger({
      transports: [
        new winston_1.default.transports.File({
          level: "debug",
          filename: e,
          format: winston_1.default.format.combine(
            winston_1.default.format.timestamp({ format: "HH:mm:ss.SSS" }),
            winston_1.default.format.printf(
              ({ level, message, timestamp }) =>
                timestamp + ` ${level}: ` + message
            )
          ),
        }),
      ],
    });
    this._fileLogger = e;
  }
  debug(e) {
    this._fileLogger.debug(e);
  }
  info(e) {
    this._fileLogger.info(e);
    console.info(packerDriverLogTagHidden, e);
    return this;
  }
  warn(e) {
    this._fileLogger.warn(e);
    console.warn(packerDriverLogTagHidden, e);
    return this;
  }
  error(e) {
    this._fileLogger.error(e);
    console.error(packerDriverLogTagHidden, e);
    return this;
  }
  clear() {
    console.debug("Clear logs...");
    remoteEditor.Logger.clear(packerDriverLogTagRegex);
  }
  _fileLogger;
}
exports.PackerDriverLogger = PackerDriverLogger;
