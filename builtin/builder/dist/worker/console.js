var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.newConsole = undefined;
exports.NewConsole = undefined;
exports.rawConsole = undefined;

const { existsSync, createWriteStream } = require("fs");

const { join } = require("path");

const { getCurrentTime } = require("../share/utils");

const electron_logger_1 = __importDefault(require("@base/electron-logger"));

const { formateBytes } = require("./builder/utils/memory-track");

const { outputFileSync } = require("fs-extra");

const logLevelMap = { error: 1, warn: 2, log: 3, debug: 4 };
class NewConsole {
  command = false;
  messages = [];
  static logDest = join(Editor.Project.path, "temp", "builder", "log");
  _groupNames = [];
  memoryTrackMap = new Map();
  static async updateLogLevel(e) {
    if (
      (e = e || (await Editor.Profile.getConfig("builder", "log.level"))) ||
      Object.values(logLevelMap).includes(Number(e))
    ) {
      electron_logger_1.default.setLevel(3);
    }
  }
  id = "default";
  logDest = join(NewConsole.logDest, "normal.log");
  _start = false;
  _console;
  _writeStream = null;
  _updateLogFileTimer = null;
  constructor() {
    if (console.__rawConsole) {
      exports.rawConsole = console.__rawConsole;
    } else {
      exports.rawConsole = console;
    }

    this.__proto__.__proto__ = exports.rawConsole;
  }
  switchConsole(e) {
    if (this._start) {
      this._console = e;
    } else {
      e.record();
    }
  }
  record(e, t) {
    try {
      this.logDest = Editor.UI.__protected__.File.resolveToRaw(t);

      if (!existsSync(this.logDest)) {
        outputFileSync(this.logDest, "");
      }

      this._writeStream = createWriteStream(this.logDest, {
        flags: "a",
      });
    } catch (e) {
      console.debug(e);
      console.debug(`Create log file failed. {file(${this.logDest})}`);
      return void (this._writeStream = null);
    }
    this._start = true;
    this._updateLogFileTimer = null;
    this._groupNames.length = 0;
    this.id = e;
    window.console = this;

    exports.rawConsole.debug(`Start record console... {file(${this.logDest})}`);
  }
  async stopRecord() {
    if (this.messages.length) {
      this._updateLogFileTimer && clearTimeout(this._updateLogFileTimer);
      await this.saveLog();
      this._updateLogFileTimer = null;
    }

    this._writeStream?.end();
    this._writeStream = null;
    this._start = false;
    this._groupNames.length = 0;
    exports.rawConsole.debug(`Stop record console. {file(${this.logDest})}`);
    window.console = exports.rawConsole;
    this.id = "";

    if (this._console) {
      this._console.record();
      delete this._console;
    }
  }
  log(...e) {
    exports.rawConsole.log(...e);

    if (this) {
      this.addMessage("log", e);
    }
  }
  error(e) {
    if (filterErrorToConsole(e)) {
      exports.rawConsole.error(e);
    } else {
      exports.rawConsole.debug(e);
    }

    if (this) {
      this.addMessage("error", e);
    }
  }
  warn(...e) {
    exports.rawConsole.warn(...e);

    if (this) {
      this.addMessage("warn", e);
    }
  }
  debug(...e) {
    exports.rawConsole.debug(...e);

    if (this) {
      this.addMessage("debug", e);
    }
  }
  group(e) {
    exports.rawConsole.group(e);
    this._groupNames.push(e);

    if (this) {
      this.addMessage("group", [e]);
    }
  }
  groupEnd() {
    exports.rawConsole.groupEnd();
    var e = this._groupNames.pop();

    if (this) {
      this.addMessage("groupEnd", [e]);
    }
  }
  groupCollapsed(e) {
    exports.rawConsole.groupCollapsed(e);
    this._groupNames.push(e);

    if (this) {
      this.addMessage("groupCollapsed", [e]);
    }
  }
  async addMessage(e, t) {
    try {
      var s = translate(t);
      var r = this.messages[this.messages.length - 1];

      if (r && s === r.value) {
        r.num++;
      } else {
        this.messages.push({
          type: e,
          value: s,
          time: getCurrentTime(),
          num: 1,
        });
      }

      await this.save();
    } catch (e) {
      exports.rawConsole.log(e);
    }
  }
  async save() {
    if (this.messages.length && this._start && !this._updateLogFileTimer) {
      await this.saveLog();

      this._updateLogFileTimer = setTimeout(() => {
        this._updateLogFileTimer = null;
        this.saveLog();
      }, 500);
    }
  }
  async saveLog() {
    var e = this.messages;
    this.messages = [];
    let s = "";

    e.forEach((e) => {
      var t = `${e.time} - ${e.type}${e.num > 1 ? "(" + e.num + ")" : ""}: ${
        e.value
      }\n`;
      s += t;

      if (this.command) {
        ccWorker.Ipc.send("build-worker:stdout", e.type, t);
      }
    });

    if (this._writeStream) {
      try {
        await this._writeStream.write(s);
      } catch (e) {
        exports.rawConsole.debug(e);
        this._writeStream.end();
        this._writeStream = null;
      }
    }
  }
  trackMemoryStart(e) {
    var t = process.memoryUsage().heapUsed;
    this.memoryTrackMap.set(e, t);
    return t;
  }
  trackMemoryEnd(e, t = true) {
    var s;
    var r;
    var o = this.memoryTrackMap.get(e);
    return o
      ? ((s = process.memoryUsage().heapUsed),
        this.memoryTrackMap.delete(e),
        (r = s - o),
        t
          ? (console.debug(
              `[Build Memory track]: ${e} start:${formateBytes(
                o
              )}, end ${formateBytes(s)}, increase: ` + formateBytes(r)
            ),
            t)
          : r)
      : 0;
  }
}
function filterErrorToConsole(e) {
  return !(e.toString() || "").match(
    /^\[build-script\]\[BABEL\].*?it exceeds the max of 500KB.\n$/g
  );
}
function translate(e) {
  if ((typeof e == "string" && !e.includes("\n")) || typeof e == "number") {
    return String(e);
  }
  if (typeof e == "string" && e.includes("\n")) {
    return translate(e.split("\n"));
  }
  if (typeof e == "object") {
    if (Array.isArray(e)) {
      let t = "";

      e.forEach((e) => {
        t += translate(e) + "\r";
      });

      return t;
    }
    try {
      return e.stack ? translate(e.stack) : JSON.stringify(e);
    } catch (e) {}
  }
  return e && e.toString && e.toString();
}
exports.NewConsole = NewConsole;
exports.newConsole = new NewConsole();
