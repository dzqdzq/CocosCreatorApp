Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryTrack = undefined;
exports.formateBytes = formateBytes;
exports.getMemorySize = getMemorySize;
class MemoryTrack {
  _startMemory = 0;
  _maxMemory = 0;
  _interval = 0;
  _intervalId = null;
  static enabled = !!Editor.App.args.metric;
  _lastMemory = 0;
  constructor(e = 1000 /* 1e3 */) {
    this._interval = e;
  }
  start() {
    if (MemoryTrack.enabled) {
      console.debug("memory track start, " + getMemorySize());
      this._startMemory = this.currentMemory;

      this._intervalId = setInterval(() => {
        var e = this.currentMemory;

        this._maxMemory = Math.max(this._maxMemory, e);
        var r = e - this._lastMemory;

        if (r >= 0) {
          if (r > 5242880) {
            console.debug(
              `memory track increment > 1M, increment: ${formateBytes(
                r
              )}, current: ${formateBytes(e)}, last: ` +
                formateBytes(this._lastMemory)
            );

            this._lastMemory = e;
          }
        }
      }, this._interval);
    }
  }
  stop() {
    if (MemoryTrack.enabled && this._intervalId) {
      console.debug("memory track stop, " + getMemorySize());
      clearInterval(this._intervalId);
      this.printResult();
    }
  }
  get memoryUsage() {
    return this._maxMemory - this._startMemory;
  }
  get currentMemory() {
    return process.memoryUsage().heapUsed;
  }
  printResult() {
    if (MemoryTrack.enabled) {
      console.log("memory track usage: " + formateBytes(this.memoryUsage));
    }
  }
}
function formateBytes(e) {
  var r = e / 1024 / 1024;
  return r < 1 ? (e / 1024).toFixed(2) + "KB" : r.toFixed(2) + "MB";
}
function getMemorySize() {
  var e = process.memoryUsage();
  return (
    "Process: heapTotal " +
    formateBytes(e.heapTotal) +
    " heapUsed " +
    formateBytes(e.heapUsed) +
    " rss " +
    formateBytes(e.rss)
  );
}
exports.MemoryTrack = MemoryTrack;
