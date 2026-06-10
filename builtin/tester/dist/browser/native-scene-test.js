Object.defineProperty(exports, "__esModule", { value: true });
exports.testNativeScene = testNativeScene;

const { collectLog } = require("./utils");

const tester_1 = require("../tester");

const { join } = require("path");

const { outputFileSync, readdir } = require("fs-extra");

async function testNativeScene(l, o = false) {
  const _ = `场景测试失败,useNative=${l} :`;

  const u = join(Editor.Project.tmpDir, "testScene", Date.now() + ".log");

  outputFileSync(u, "");
  console.log("testScene log path", u);

  return new Promise((e, t) => {
    let i = "success";
    const r = setTimeout(() => {
      i = _ + " 超时";
      c();
    }, 300000 /* 3e5 */);
    function c() {
      clearTimeout(r);

      Editor.Message.__protected__.removeBroadcastListener(
        "crash-reporter:report",
        s
      );

      collectLog(u, i).then(() => {
        e(i);
      });
    }
    function s(e) {
      console.error(_, e.details);
      i = _ + " 场景崩溃,原生堆栈文件在工程temp/crash目录下";
      c();
    }
    async function n() {
      Editor.Message.__protected__.removeBroadcastListener("scene:ready", n);
      var e = await Editor.Message.request("scene", "is-native");
      if (l && !e) {
        i = _ + ",编译未通过,无法正常启动原生场景";
      } else {
        tester_1.tester.on("print", async (e) => {
          await collectLog(u, e);

          if (e.type === "log") {
            return console.log(e.message);
          }

          if (e.type === "error") {
            i = _ + " 存在测试例未通过，请查看日志" + u;
            return console.error(e.message);
          }

          return void console.log(e);
        });
        var t = join(Editor.App.path, "builtin/scene/test");
        var r = await readdir(t);
        for (let e = 0; e < r.length; e++) {
          var s = r[e];
          if (s.endsWith("spec.js")) {
            var o = join(t, s);
            try {
              var a = "run test:" + s;
              await collectLog(u, a, console.log);
              require(o);
              await tester_1.tester.run();
            } catch (e) {
              i = _ + " 存在测试例未通过，请查看日志" + u;
              s =
                o +
                `测试异常
` +
                e;
              await collectLog(u, s, console.error);
            }
            delete require.cache[o];
          }
        }
      }
      c();
    }

    Editor.Message.__protected__.addBroadcastListener(
      "crash-reporter:report",
      s
    );

    Editor.Message.__protected__.addBroadcastListener("scene:ready", n);

    if (o) {
      n();
    }
  });
}
