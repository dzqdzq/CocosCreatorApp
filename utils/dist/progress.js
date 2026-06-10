Object.defineProperty(exports, "__esModule", { value: true });
exports.quickSpawn = quickSpawn;

const { spawn } = require("child_process");

function quickSpawn(
  t,
  d,
  c = { downGradeLog: true, onlyPrintWhenError: true, prefix: "" }
) {
  return new Promise((e, o) => {
    c.prefix = c.prefix || "";
    var r = spawn(t, d, {
      cwd: c?.cwd || undefined,
      env: c?.env,
      ...c,
    });
    let n = "";
    function i(r, e) {
      if (c.onlyPrintWhenError) {
        n += e;
      } else {
        r === "log" && c.downGradeLog
          ? (r = "debug")
          : r === "warn" && c.downGradeWaring
          ? (r = "log")
          : r === "error" && c.downGradeError && (r = "warn");

        console[r](c.prefix + e.toString());
      }
    }

    if (c.logLevel !== undefined && c.logLevel >= 0) {
      r.stdout.on("data", (r) => {
        i("log", r);
      });
    }

    if (c.logLevel !== undefined && c.logLevel >= 1) {
      r.stderr.on("data", (r) => {
        var e = r.toString();

        if (e && e !== "\n") {
          i("error", r);
        }
      });
    }

    r.on("close", (r) => {
      if (r !== 0) {
        o(
          c.prefix +
            (`Child process exit width code ${r}: ${t} ` + d.toString())
        );
      } else {
        e(true);
      }
    });

    r.on("error", (r) => {
      if (n) {
        console.debug(c.prefix + "child process output: ", { outputData: n });
      }

      console.error(c.prefix + (`child process error: ${t} ` + d.toString()));

      o(r);
    });

    r.on("exit", (r) => {
      if (!c.onlyPrintWhenError) {
        console.debug(c.prefix + "Child process exit width code " + r);
      }
    });
  });
}
