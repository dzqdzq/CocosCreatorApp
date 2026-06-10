Object.defineProperty(exports, "__esModule", { value: true });
exports.collator = undefined;
exports.getFileTree = getFileTree;
exports.getPackageFileExtend = getPackageFileExtend;
exports.openFile = openFile;

const { join, basename } = require("path");

const { existsSync, readdir, statSync, readFileSync } = require("fs-extra");

const electron_1 = require("electron");

const { spawn } = require("child_process");

const { parse } = require("plist");

async function getFileTree(a, i) {
  var e;
  return existsSync(a)
    ? ((e = await readdir(a)),
      (
        await Promise.all(
          e.map(async (e) => {
            var t = join(a, e);
            let r = false;
            try {
              r = statSync(t).isDirectory();
            } catch (e) {
              return;
            }
            if (!e.startsWith(".")) {
              t = {
                detail: { value: e },
                showArrow: false,
                isDirectory: r,
                filePath: t,
                root: i,
              };

              if (r) {
                e = (await getFileTree(join(a, e), i)) ?? [];
                t.children = e;
                t.showArrow = !!e?.length;
              }

              return t;
            }
          })
        )
      ).filter((e) => e !== undefined))
    : [];
}
async function getPackageFileExtend(e) {
  return {
    detail: { value: basename(e) },
    showArrow: true,
    isDirectory: true,
    filePath: e,
    children: await getFileTree(e, e),
  };
}
async function getCodeEditor() {
  let e = "";
  var t = await Editor.Message.request(
    "program",
    "query-program-info",
    "scriptEditor"
  );
  if (t?.path) {
    e = t.path;
  } else {
    try {
      var r = await electron_1.app.getApplicationInfoForProtocol("vscode://");

      if (r.name === "Visual Studio Code") {
        e = r.path;
      }
    } catch (e) {}
  }
  return e;
}
function openAssetWithProgram(e, t, r) {
  r = r || [];
  let a = "";
  var i;

  if (process.platform === "darwin") {
    a = "open";

    t.endsWith(".app") &&
      ((t = join(t, "/Contents/MacOS/")),
      (i = parse(readFileSync(join(t, "../Info.plist"), "utf8"))),
      (t = join(t, i.CFBundleExecutable)));

    r ? r.unshift("-a", t) : (r = ["-a", t, e]);
  } else if (process.platform === "win32") {
    a = t;
    r?.length || (r = [e]);
  }

  spawn(a, r, { detached: true, stdio: "ignore" }).unref();
}
async function openFile(e, t) {
  openAssetWithProgram(e, await getCodeEditor(), [t, e]);
}
exports.collator = new Intl.Collator("en", {
  numeric: true,
  sensitivity: "base",
  ignorePunctuation: true,
});
