Object.defineProperty(exports, "__esModule", { value: true });

const { debounce } = require("throttle-debounce");

const list = (exports.list = []);
const outputList = (exports.outputList = []);
let updateFn;
let lineHeight;
let collapse = true;
let filterTypes = [];
let filterText = "";
let filterRegex = false;
let isShowDate = false;
let animationId;
const logCounter = { log: 0, warn: 0, error: 0, info: 0 };

exports.setUpdateFn = (t) => {
  updateFn = t;
};

exports.setLineHeight = (t) => {
  lineHeight = t;
  exports.lineHeight = t;
  exports.update();
};

exports.reset = (t) => {
  exports.clear();
  for (const e of t) {
    exports.addItem(e);
  }
  exports.update();
};

exports.addItem = (t) => {
  t.dateTime = dateFormat(t.time);
  var e = { type: "log" };

  var o = t.message
    .toString()
    .split("\n")
    .filter((t) => t.trim() !== "");

  e.type = t.type;

  if (t.stack && typeof t.stack == "string") {
    e.stack = t.stack
      .split(/(\r\n|\r|\n)/)
      .filter((t) => /^[^\n|\r]+$/.test(t));
  } else {
    e.stack = [];
  }

  e.rows = o.length + e.stack.length;
  e.title = o[0] || "";
  e.content = o.splice(1);
  e.fold = true;
  e.count = 1;
  e.time = t.time;
  e.dateTime = t.dateTime;
  list.push(e);

  if (e.title) {
    logCounter[e.type] += 1;
    updateFooterCounter();
  }
};

exports.setCollapse = (t) => {
  collapse = t;
  exports.update();
};

exports.setFilterType = (t) => {
  filterTypes = t;
  exports.update();
};

exports.setFilterText = (t) => {
  filterText = t;
  exports.update();
};

exports.setFilterRegex = (t) => {
  filterRegex = t;

  if (filterText) {
    exports.update();
  }
};

exports.showDate = (t) => {
  isShowDate = t;
  exports.update();
};

let updateLocker = !(exports.clear = () => {
  list.length = 0;
  logCounter.log = 0;
  logCounter.warn = 0;
  logCounter.error = 0;
  logCounter.info = 0;
  exports.update();
});
exports.update = (...t) => {
  if (!updateLocker) {
    updateLocker = true;
    window.cancelAnimationFrame(animationId);

    animationId = requestAnimationFrame(() => {
      let s = filterText;
      let r = 0;
      outputList.length = 0;

      if (filterRegex) {
        try {
          s = new RegExp(s);
        } catch (t) {
          s = /.*/;
        }
      }

      list
        .filter((e) => {
          var t = !!e.title;

          var o = filterTypes.some((t) => t === e.type);

          var r = filterRegex ? s.test(e.title) : e.title.includes(s);
          return t && o && r;
        })
        .forEach((t) => {
          var e = outputList[outputList.length - 1];

          var o =
            e &&
            e.title === t.title &&
            e.type === t.type &&
            e.content.join("\n") === t.content.join("\n") &&
            e.stack.join("\n") === t.stack.join("\n");

          if (collapse && o) {
            e.count += 1;
          } else {
            t.count = 1;
            t.translateY = r;
            t.date = isShowDate ? t.dateTime : null;
            outputList.push(t);
            r += t.fold ? lineHeight : t.rows * lineHeight;
          }
        });

      if (typeof updateFn == "function") {
        updateFn(...t);
      }

      updateLocker = false;
    });
  }
};
const updateFooterCounter = debounce(500, () => {
  Editor.Message.broadcast("console:logsUpdate", logCounter);
});
function dateFormat(t) {
  t = new Date(t);
  return (
    t.getFullYear() +
    "-" +
    ((t.getMonth() + 1 < 10 ? "0" + (t.getMonth() + 1) : t.getMonth() + 1) +
      "-") +
    ((t.getDate() < 10 ? "0" + t.getDate() : t.getDate()) + " ") +
    ((t.getHours() < 10 ? "0" + t.getHours() : t.getHours()) + ":") +
    ((t.getMinutes() < 10 ? "0" + t.getMinutes() : t.getMinutes()) + ":") +
    (t.getSeconds() < 10 ? "0" + t.getSeconds() : t.getSeconds())
  );
}
