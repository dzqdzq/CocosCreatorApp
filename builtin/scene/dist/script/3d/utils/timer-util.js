Object.defineProperty(exports, "__esModule", { value: true });
exports.TimerUtil = undefined;
let mainProcessIntervalIds = [];
const remoteSetTimeout = require("@electron/remote").getGlobal("setTimeout");
const remoteClearTimeout =
  require("@electron/remote").getGlobal("clearTimeout");
const remoteSetInterval = require("@electron/remote").getGlobal("setInterval");
const remoteClearInterval =
  require("@electron/remote").getGlobal("clearInterval");
class TimerUtil {
  _timeInterval = 200;
  constructor(e) {
    this._timeInterval = e ?? 200;
  }
  _callWaitingMap = new Map();
  callFunctionLimit(t, e, ...r) {
    let i = this._callWaitingMap.get(t);
    let a = false;

    if (i) {
      if (i.waitingTimer) {
        i.callFunc = e;
        i.args = r;
        i.needCallAfterWaiting = true;
      } else {
        a = true;
      }
    } else {
      i = { needCallAfterWaiting: false };
      this._callWaitingMap.set(t, i);
      a = true;
    }

    if (a) {
      e(...r);

      i.waitingTimer = setTimeout(() => {
        var e;

        if (i) {
          i.waitingTimer = undefined;
        }

        if (
          i &&
          i.needCallAfterWaiting &&
          ((i.needCallAfterWaiting = false), i.callFunc)
        ) {
          e = i.args ?? [];
          this.callFunctionLimit(t, i.callFunc, ...e);
        }
      }, this._timeInterval);
    }
  }
  clear() {
    this._callWaitingMap.forEach((e) => {
      if (e.waitingTimer) {
        clearTimeout(e.waitingTimer);
      }
    });

    this._callWaitingMap.clear();
  }
  static setMainProcessTimeout(e, t) {
    return remoteSetTimeout(e, t);
  }
  static clearMainProcessTimeout(e) {
    remoteClearTimeout(e);
  }
  static setMainProcessInterval(e, t) {
    e = remoteSetInterval(e, t);
    mainProcessIntervalIds.push(e);
    return e;
  }
  static clearMainProcessInterval(e) {
    var t = mainProcessIntervalIds.indexOf(e);

    if (t >= 0) {
      remoteClearInterval(e);
      mainProcessIntervalIds.splice(t, 1);
    }
  }
  static clearTimerAndInterval() {
    mainProcessIntervalIds.forEach((e) => {
      this.clearMainProcessInterval(e);
    });

    mainProcessIntervalIds = [];
  }
}
exports.TimerUtil = TimerUtil;
