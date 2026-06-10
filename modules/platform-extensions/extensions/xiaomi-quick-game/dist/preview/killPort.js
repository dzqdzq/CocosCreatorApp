var childProcess = require("child_process");

var { spawn, exec, execSync, spawnSync } = childProcess;

function killAll(e, n, r) {
  var i = {};
  try {
    Object.keys(e).forEach((c) => {
      e[c].forEach((c) => {
        if (!i[c]) {
          killPid(c, n);
          i[c] = 1;
        }
      });

      if (!i[c]) {
        killPid(c, n);
        i[c] = 1;
      }
    });
  } catch (c) {
    if (r) {
      return r(c);
    }
    throw c;
  }
  if (r) {
    return r();
  }
}
function killPid(c, e) {
  try {
    process.kill(parseInt(c, 10), e);
  } catch (c) {
    if (c.code !== "ESRCH") {
      throw c;
    }
  }
}
function Uint8ArrayToString(c) {
  for (var e = "", n = 0; n < c.length; n++) {
    e += String.fromCharCode(c[n]);
  }
  return e;
}
function killInMac(c) {
  var e;

  Uint8ArrayToString(spawnSync("lsof", ["-i", ":" + c]).stdout)
    .split(/[\n|\r]/)
    .forEach((c) => {
      if (c.includes("LISTEN") && !e) {
        c = c.split(/\s+/);
        /\d+/.test(c[1]) && (e = c[1]);
      }
    });

  if (e) {
    execSync("kill -9 " + e);
  } else {
    console.log(`port:${c} close!`);
  }
}
function buildProcessTree(e, n, r, i, o) {
  var c = i(e);
  var t = "";
  c.stdout.on("data", (c) => {
    c = c.toString("ascii");
    t += c;
  });
  c.on("close", (c) => {
    delete r[e];

    if (c != 0) {
      if (Object.keys(r).length == 0) {
        o();
      }
    } else {
      t.match(/\d+/g).forEach((c) => {
        c = parseInt(c, 10);
        n[e].push(c);
        n[c] = [];
        r[c] = 1;
        buildProcessTree(c, n, r, i, o);
      });
    }
  });
}
module.exports = (c, e, n, r) => {
  var i = {};
  var o = {};
  i[c] = [];
  o[c] = 1;

  if (typeof n == "function" && r === undefined) {
    r = n;
    n = undefined;
  }

  switch (process.platform) {
    case "win32": {
      execSync("taskkill /pid " + c + " /T /F");
      break;
    }
    case "darwin": {
      killInMac(e);
      break;
    }
    default: {
      buildProcessTree(
        c,
        i,
        o,
        (c) => spawn("ps", ["-o", "pid", "--no-headers", "--ppid", c]),
        () => {
          killAll(i, n, r);
        }
      );
    }
  }
};
