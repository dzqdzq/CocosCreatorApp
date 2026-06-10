Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveFileNameConflict = undefined;
exports.getName = getName;
exports.unzip = unzip;
exports.copy = copy;
exports.trashItem = trashItem;

const { spawn } = require("child_process");

const { extname, basename, join, dirname } = require("path");

const {
  existsSync,
  ensureDirSync,
  remove,
  readdirSync,
  copy: copy_2,
  lstatSync,
  chmodSync,
  copySync,
} = require("fs-extra");

const resolveFileNameConflict = (e, t) => {
  if (!t) {
    throw new Error("fileName is empty");
  }
  var r = extname(t);
  let a = basename(t, r);

  while (existsSync(join(e, "" + a + r))) {
    if (/(\d+)$/.test(a)) {
      a = /^\d+$/.test(a)
        ? (parseInt(a, 10) + 1).toString().padStart(a.length, "0")
        : a.replace(
            /^(.*?)(\d+)$/,
            (e, t, r) =>
              "" + t + (parseInt(r, 10) + 1).toString().padStart(r.length, "0")
          );
    } else {
      a += "-001";
    }
  }

  return "" + a + r;
};

function getName(e) {
  var t;
  var r;
  return existsSync(e)
    ? ((t = dirname(e)),
      (r = basename(e)),
      (r = (0, exports.resolveFileNameConflict)(t, r)),
      join(t, r))
    : e;
}
exports.resolveFileNameConflict = resolveFileNameConflict;

const unzipOfDarwin = (e, t, r) => {
  var a = dirname(t);

  var a = (ensureDirSync(a), spawn("unzip", [e, "-d", t]));

  let n = "";

  a.stderr.on("data", (e) => {
    n += e;
  });

  let s = "";

  a.stdout.on("data", (e) => {
    s += e;
  });

  a.on("close", (e) => {
    if (s) {
      console.log(s);
    }

    if (n) {
      console.warn(n);
    }

    let t = null;

    if (e !== 0) {
      t = new Error("The decompression has failed");
    }

    r(t);
  });
};

const unzipOfWin32 = (e, t, r) => {
  var a = dirname(t);

  var a =
    (ensureDirSync(a),
    spawn(join(Editor.App.path, "../tools/unzip.exe"), [e, "-d", t]));

  let n = "";

  a.stderr.on("data", (e) => {
    n += e;
  });

  let s = "";

  a.stdout.on("data", (e) => {
    s += e;
  });

  a.on("close", (e) => {
    if (s) {
      console.log(s);
    }

    if (n) {
      console.warn(n);
    }

    let t = null;

    if (e !== 0) {
      t = new Error("The decompression has failed");
    }

    r(t);
  });
};

async function unzip(e, t, r = {}) {
  let a;
  a = process.platform === "win32" ? unzipOfWin32 : unzipOfDarwin;
  const n = join(Editor.Project.tmpDir, ".utils_temp", basename(e, ".zip"));
  await remove(n);

  await new Promise((t, r) => {
    a(e, n, (e) => {
      if (e) {
        return r(e);
      }
      t();
    });
  });

  if (r.peel && (r = readdirSync(n)).length === 1) {
    await copy_2(join(n, r[0]), t);
  } else {
    await copy_2(n, t);
  }

  await remove(n);
}
function copy(e, t) {
  !(function e(t, r) {
    if (existsSync(t)) {
      var a = lstatSync(t);
      if (a.isDirectory()) {
        ensureDirSync(r);

        if (!a.isSymbolicLink()) {
          chmodSync(r, 511);
        }

        for (const n of readdirSync(t)) {
          e(join(t, n), join(r, n));
        }
      } else {
        copySync(t, r);

        if (!a.isSymbolicLink()) {
          chmodSync(r, 511);
        }
      }
    }
  })(e, t);
}
async function trashItem(e) {
  var t;

  if (process.type === "browser") {
    t = require("electron").shell;
    await t.trashItem(e);
  } else {
    t = require("@electron/remote").shell;
    await t.trashItem(e);
  }
}
