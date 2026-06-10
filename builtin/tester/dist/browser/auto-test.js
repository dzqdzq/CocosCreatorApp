var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.autoTest = autoTest;

const { testNativeScene } = require("./native-scene-test");

const { collectLog } = require("./utils");

const { existsSync, readdirSync, outputFileSync } = require("fs-extra");
const tester_1 = require("../tester");

const { join, basename } = require("path");

const fast_glob_1 = __importDefault(require("fast-glob"));
const TEST_CONFIG_NAME = "test.config.js";
async function autoTest(t) {
  if (t.useNative !== undefined) {
    e = (t.nativeConfig || {}).immediately;
    return testNativeScene(t.useNative, e);
  }
  await waitEditorReady();
  var e = await sortTestInfos(t);
  if (!e.length) {
    return 0;
  }
  let s = true;
  let r = 0;
  const o = [];
  var n = Date.now().toString();
  const i = join(Editor.Project.tmpDir, "test", n, "report.txt");

  if (t.outputReport && !existsSync(i)) {
    outputFileSync(i, "");
  }

  tester_1.tester.on("print", async (e) => {
    r++;

    if (t.outputReport) {
      collectLog(i, e);
    }

    if (e.type === "log") {
      return console.log(e.message);
    }

    if (e.type === "error") {
      s = false;
      o.push(e.message);
      return console.error(e.message);
    }

    return void console.log(e);
  });

  for (const c of e) {
    if (c.list && c.list.length) {
      var a = saveReadConfig(join(c.dir, TEST_CONFIG_NAME));
      try {
        if (a && a.wait) {
          await a.wait(c.list, t);
        }
      } catch (e) {
        console.error(e);
        s = false;
        continue;
      }
      sortResult(c.list);
      for (const u of c.list) {
        console.log("======== execute script: ", u, "========");

        if (t.outputReport) {
          collectLog(i, `======== ${u} ========`);
        }

        try {
          require(u);
          await tester_1.tester.run();
        } catch (e) {
          console.error(e);
        }
        delete require.cache[u];
      }
    }
  }
  n = s ? 0 : -1;

  console.log(
    `output test report in ${i}, success: ${r - o.length} / ${r}, exitCode: ` +
      n
  );

  console.log(
    `auto test failed in : 
       ` + o.join("\n")
  );

  return n;
}
async function waitEditorReady() {
  console.debug("waiting for editor scene ready ....");

  return (
    !!(await Editor.Message.request("scene", "query-is-ready")) ||
    new Promise((e) => {
      const t = async () => {
        Editor.Message.__protected__.removeBroadcastListener("scene:ready", t);

        Editor.Panel.open("scene");

        setTimeout(() => {
          console.debug("scene:ready");
          e(true);
        }, 500);
      };
      Editor.Message.__protected__.addBroadcastListener("scene:ready", t);
    })
  );
}
async function sortTestInfos(e) {
  var t = [];
  for (const o of Editor.Package.getPackages()) {
    if (!e.packages || e.packages.includes(o.name)) {
      var s = join(o.path, "test");
      if (existsSync(s)) {
        var r = await (0, fast_glob_1.default)("**/*.spec.js", {
          cwd: s,
          onlyFiles: true,
          absolute: true,
        });
        if (r.length !== 0) {
          if (o.enable) {
            const n = saveReadConfig(join(s, TEST_CONFIG_NAME));
            let e = undefined;

            if (n) {
              if (n.includes) {
                e = (t) => !!n.includes.find((e) => t.includes(e));
              } else if (n.excludes) {
                e = (t) =>
                  !n.excludes.find((e) => t.includes(e)) &&
                  /\.spec\.js$/.test(t);
              }
            }

            t.push({ dir: s, list: e ? r.filter(e) : r, name: o.name });
          } else {
            console.log(`skip test package ${o.name} cause it is disabled.`);
          }
        }
      }
    }
  }
  return t;
}
function saveReadConfig(e) {
  try {
    return existsSync(e) ? require(e) : null;
  } catch (e) {
    console.error(e);
    return null;
  }
}
function sortResult(e) {
  return e.sort((e, t) => {
    var s = (e) => basename(e);

    var r = (e) => {
      e = e.match(/^(\d+)/);
      return e ? parseInt(e[1], 10) : Infinity;
    };

    var e = s(e);
    var s = s(t);
    return r(e) - r(s);
  });
}
