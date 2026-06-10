Object.defineProperty(exports, "__esModule", { value: true });
exports.collectLog = collectLog;

const { appendFile } = require("fs-extra");

async function collectLog(t, e, r) {
  let s = e;
  let n = false;

  if (typeof e == "object") {
    n = e.type === "error";
    s = e.message;
  }

  var a =
    `${n ? "[X]" : "   "} ${translateLogMsg(s)}
 ` + e.stack;
  await appendFile(t, a);

  if (r) {
    r(e);
  }
}
function translateLogMsg(t) {
  if (typeof t != "string" || t.includes("\n")) {
    if (typeof t == "string" && t.includes("\n")) {
      return translateLogMsg(t.split("\n"));
    }
    if (Array.isArray(t)) {
      let e = "";

      t.forEach((t) => {
        e += translateLogMsg(t) + "\r";
      });

      return e;
    }
    try {
      return JSON.stringify(t);
    } catch (t) {}
  }
  return t;
}
