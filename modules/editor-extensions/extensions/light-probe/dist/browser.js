Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
let isStart = false;
let isFinish = false;
let isEnd = false;
let currProgress = 0;
let bakerSum = 20;
let rate = 0;
let logs = [];
function initVal() {
  currProgress = 0;
  bakerSum = 20;
  rate = 0;
}
function changeProgress(s = null, e = true) {
  if (!s) {
    (currProgress += 10) >= bakerSum - 10 && (bakerSum += 10);
    s = (currProgress / bakerSum) * 100;
    e && (s /= 2);
  }

  rate = s;
}
exports.methods = {
  open() {
    Editor.Panel.open("light-probe");
  },
  start() {
    isStart = true;
    isFinish = false;
    isEnd = false;
    initVal();
    (logs = []).push("Light probe baking started.");
  },
  cancel() {
    isFinish = false;
    isEnd = true;
    logs.push("Light probe baking canceled.");
    initVal();
  },
  log(s) {
    logs.push(
      s +
        `
`
    );

    if (isFinish) {
      changeProgress(null, false);
    }
  },
  progress(s) {
    logs.push(
      s +
        `
`
    );

    if (!isFinish) {
      changeProgress();
    }
  },
  finished() {
    isFinish = true;
    isEnd = false;
    changeProgress(80);
  },
  end() {
    isEnd = true;
    logs.push("Light probe baking finished.");
    changeProgress(100);
    Editor.Message.request("scene", "light-probe-update-tetrahedron");
  },
  clear() {
    logs = ["Clear Light probe baking result."];
    isStart = false;
    isFinish = false;
    isEnd = false;
    initVal();
    Editor.Message.request("scene", "light-probe-update-tetrahedron");
  },
  unstaging() {
    return {
      rate,
      logs,
      isStart,
      isFinish,
      isEnd,
    };
  },
};
