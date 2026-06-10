Object.defineProperty(exports, "__esModule", { value: true });
exports.newConsole = undefined;
exports.NewConsole = undefined;
exports.formateBytes = formateBytes;
exports.transTimeToNumber = transTimeToNumber;
exports.getCurrentLocalTime = getCurrentLocalTime;
exports.getRealTime = getRealTime;

const { existsSync } = require("fs");

const { outputFileSync, readdir, remove, appendFile } = require("fs-extra");

const { join, basename } = require("path");

let rawConsole;
class NewConsole {
  command = false;
  messages = [];
  static logDest = join(Editor.Project.path, "temp", "asset-db", "log");
  logDest;
  _start = false;
  memoryTrackMap = new Map();
  constructor() {
    this.logDest = join(NewConsole.logDest, getCurrentLocalTime() + ".log");

    rawConsole = console.__rawConsole || console;
    this.__proto__.__proto__ = rawConsole;
  }
  initLogFiles() {
    try {
      if (!existsSync(this.logDest)) {
        outputFileSync(this.logDest, "");
      }
    } catch (e) {
      console.debug(e);
    }
  }
  async clearAuto() {
    try {
      var e;
      var t = await readdir(NewConsole.logDest);

      if (t.length) {
        t.sort((e, t) => transTimeToNumber(t) - transTimeToNumber(e));
        e = t.slice(4, t.length - 1);

        await Promise.all(
          e.map((e) => {
            remove(join(NewConsole.logDest, e));
          })
        );
      }
    } catch (e) {
      console.debug(e);
    }
  }
  record() {
    if (window.console.switchConsole) {
      window.console.switchConsole(this);
    } else {
      this._start = true;
      window.console = this;

      rawConsole.debug(`Start record asset-db log in {file(${this.logDest})}`);
    }
  }
  stopRecord() {
    rawConsole.debug(`Stop record asset-db log. {file(${this.logDest})}`);
    window.console = rawConsole;
    this._start = false;
  }
  log(...e) {
    rawConsole.log(...e);

    if (this._start) {
      this.messages.push({ type: "log", value: e });
      this.save();
    }
  }
  error(e) {
    rawConsole.error(e);

    if (this._start) {
      this.messages.push({ type: "error", value: e });
      this.save();
    }
  }
  warn(...e) {
    rawConsole.warn(...e);

    if (this._start) {
      this.messages.push({ type: "warn", value: e });
      this.save();
    }
  }
  debug(...e) {
    rawConsole.debug(...e);

    if (this._start) {
      this.messages.push({ type: "debug", value: e });
      this.save();
    }
  }
  async save() {
    var e;

    if (this._start && this.messages.length) {
      e = this.messages.shift();
      await this.saveLog(e.type, e.value);
    }
  }
  async saveLog(e, t) {
    if (t && existsSync(this.logDest)) {
      e = `${getRealTime()}-${e}: ${translate(t)}\n`;
      appendFile(this.logDest, e);
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
          ? (r > 1048576 &&
              console.debug(
                `[Assets Memory track]: ${e} start:${formateBytes(
                  o
                )}, end ${formateBytes(s)}, increase: ` + formateBytes(r)
              ),
            t)
          : r)
      : 0;
  }
}
function formateBytes(e) {
  return (e / 1024 / 1024).toFixed(2) + "MB";
}
function transTimeToNumber(e) {
  var t = (e = basename(e, ".log")).match(/-(\d+)$/);
  return (
    t
      ? (((e = Array.from(e))[t.index] = ":"), new Date(e.join("")))
      : new Date()
  ).getTime();
}
function getCurrentLocalTime() {
  var e = new Date();
  return (e.toLocaleDateString().replace(/\//g, "-") +
  " " + e.toTimeString().slice(0, 5).replace(/:/g, "-"));
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
function getRealTime() {
  var e = new Date();
  return (e.toLocaleDateString().replace(/\//g, "-") +
  " " + e.toTimeString().slice(0, 8));
}
exports.NewConsole = NewConsole;
exports.newConsole = new NewConsole();
