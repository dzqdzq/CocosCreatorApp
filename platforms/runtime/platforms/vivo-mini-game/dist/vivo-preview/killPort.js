var childProcess = require("child_process");

var { spawn, exec, execSync, spawnSync } = childProcess;

function killAll(n, e, i) {
  var r = {};
  try {
    Object.keys(n).forEach((c) => {
      n[c].forEach((c) => {
        if (!r[c]) {
          killPid(c, e);
          r[c] = 1;
        }
      });

      if (!r[c]) {
        killPid(c, e);
        r[c] = 1;
      }
    });
  } catch (c) {
    if (i) {
      return i(c);
    }
    throw c;
  }
  if (i) {
    return i();
  }
}
function killPid(c, n) {
  try {
    process.kill(parseInt(c, 10), n);
  } catch (c) {
    if (c.code !== "ESRCH") {
      throw c;
    }
  }
}
function Uint8ArrayToString(c) {
  for (var n = "", e = 0; e < c.length; e++) {
    n += String.fromCharCode(c[e]);
  }
  return n;
}
function killInMac(c) {
  var n;

  Uint8ArrayToString(spawnSync("lsof", ["-i", ":" + c]).stdout)
    .split(/[\n|\r]/)
    .forEach((c) => {
      if (c.includes("LISTEN") && !n) {
        c = c.split(/\s+/);
        /\d+/.test(c[1]) && (n = c[1]);
      }
    });

  if (n) {
    execSync("kill -9 " + n);
  } else {
    Editor.log(`port:${c} close!`);
  }
}
function buildProcessTree(n, e, i, r, t) {
  var c = r(n);
  var o = "";
  c.stdout.on("data", (c) => {
    c = c.toString("ascii");
    o += c;
  });
  c.on("close", (c) => {
    delete i[n];

    if (c != 0) {
      if (Object.keys(i).length == 0) {
        t();
      }
    } else {
      o.match(/\d+/g).forEach((c) => {
        c = parseInt(c, 10);
        e[n].push(c);
        e[c] = [];
        i[c] = 1;
        buildProcessTree(c, e, i, r, t);
      });
    }
  });
}
module.exports = (c, n, e, i) => {
  var r = {};
  var t = {};
  r[c] = [];
  t[c] = 1;

  if (typeof e == "function" && i === undefined) {
    i = e;
    e = undefined;
  }

  switch (process.platform) {
    case "win32": {
      execSync("taskkill /pid " + c + " /T /F");
      break;
    }
    case "darwin": {
      killInMac(n);
      break;
    }
    default: {
      buildProcessTree(
        c,
        r,
        t,
        (c) => spawn("ps", ["-o", "pid", "--no-headers", "--ppid", c]),
        () => {
          killAll(r, e, i);
        }
      );
    }
  }
};
