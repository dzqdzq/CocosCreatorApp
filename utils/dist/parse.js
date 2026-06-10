function when(when) {
  if (typeof when != "string") {
    return {};
  }
  const result = {};
  const results = when.split("&&");

  results.forEach((str) => {
    try {
      const array = str.match(/ ?(\S+) ?!?=+ ?(\S+) ?/);

      if (array && array[1] && array[2]) {
        result[array[1]] = eval(array[2]);
      }
    } catch (error) {
      console.error(error);
    }
  });

  return result;
}
function checkWhen(when) {
  if (!when) {
    return true;
  }
  if (typeof when != "string") {
    return false;
  }
  const $panel = require("@editor/panel");
  const $focusPanel = $panel.getFocusPanel();
  const EditMode = Editor.EditMode.getMode();
  const $focusPanel_current = $focusPanel.current;
  try {
    return eval(when);
  } catch (error) {
    console.error(error);
    return false;
  }
}
function compareVersion(r, e, t = ".") {
  if (typeof r != "string" || typeof e != "string") {
    throw new Error(`invalid param: ${r}, ` + e);
  }
  r = r.replace(t, "").padStart(3, "0");
  e = e.replace(t, "").padStart(3, "0");
  return Number(r) > Number(e);
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.when = when;
exports.checkWhen = checkWhen;
exports.compareVersion = compareVersion;
