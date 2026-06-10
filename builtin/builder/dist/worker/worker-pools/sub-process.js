const ps = require("path");

process.on("uncaughtException", (e) => {
  console.error(e);
});

process.on("message", async (e) => {
  if (e.type === "execute-script" && process.send) {
    e = await executeScript(e.path, e.method, e.args);

    process.send({
      data: e instanceof Error ? null : e,
      code: e instanceof Error ? -1 : 0,
      type: "execute-script-end",
    });
  }
});

const console_warn = console.warn;
async function executeScript(e, n = "handler", r = []) {
  try {
    return await require(e)[n](...r);
  } catch (e) {
    console.error(e);
    return e;
  }
}

console.warn = (...e) => {
  try {
    if (typeof e[0] == "string") {
      e[0] = "[warning]" + e[0];
    } else if (e[0] && e[0].name) {
      e[0].name = "[warning]" + e[0].name;
    }
  } catch (e) {
    console.debug(e);
  }
  console_warn(...e);
};

console.log(
  `enter sub process ${process.pid}, ${process.debugPort}, see: chrome://inspect/#devices`
);
