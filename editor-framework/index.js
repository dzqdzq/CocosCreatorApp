"use strict";
require("./lib/share/require");
require("./lib/share/polyfills");
const e = require("./lib/main");
const o = require("electron");
const r = require("chalk");
const t = require("fire-path");
const n = require("fire-fs");
const s = require("winston");
const i = require("async");
const a = o.app;
let l = process.cwd();
let c = process.argv.map((e) => t.resolve(l, e)).indexOf(a.getAppPath());

if (-1 !== c) {
  process.argv.splice(c, 1);
}

process.removeAllListeners("uncaughtException");

process.on("uncaughtException", (e) => {
  console.log(
    r.red.inverse.bold("Uncaught Exception: ") + r.red(e.stack || e)
  );
});

require("module").globalPaths.push(t.join(a.getAppPath(), "node_modules"));
const d = require("yargs");
let p;

p = "darwin" === process.platform
  ? t.join(a.getPath("home"), `Library/Logs/${e.App.name}`)
  : t.join(e.App.home, "logs");

const u = t.join(p, `${e.App.name}.log`);
d.help("help")
  .version(a.getVersion())
  .options({
    dev: {
      type: "boolean",
      global: true,
      desc: "Run in development environment.",
    },
    "show-devtools": {
      type: "boolean",
      global: true,
      desc: "Open devtools automatically when main window loaded.",
    },
    debug: {
      type: "number",
      default: 3030,
      global: true,
      desc: "Open in browser context debug mode.",
    },
    "debug-brk": {
      type: "number",
      default: 3030,
      global: true,
      desc: "Open in browser context debug mode, and break at first.",
    },
    lang: {
      type: "string",
      default: "",
      global: true,
      desc: "Choose a language",
    },
    logfile: {
      type: "string",
      default: u,
      global: true,
      desc: "Specific your logfile path",
    },
  })
  .command(
    "test <path>",
    "Run specific test",
    (e) =>
      e.usage("Command: test <path>").options({
        renderer: { type: "boolean", desc: "Run tests in renderer." },
        package: { type: "boolean", desc: "Run specific package tests." },
        detail: {
          type: "boolean",
          default: false,
          desc: "Run test in debug mode (It will not quit the test, and open the devtools to help you debug it).",
        },
        reporter: {
          type: "string",
          default: "dot",
          desc: "Test reporter, default is 'dot'",
        },
      }),
    (e) => {
      e._command = "test";
    }
  )
  .command(
    "build <path>",
    "Build specific package",
    (e) => e.usage("Command: build <path>"),
    (e) => {
      e._command = "build";
    }
  );
const g = __dirname;
const m = JSON.parse(n.readFileSync(t.join(g, "package.json")));
n.ensureDirSync(e.App.home);
n.ensureDirSync(t.join(e.App.home, "local"));

s.setLevels({
  normal: 0,
  success: 1,
  failed: 2,
  info: 3,
  warn: 4,
  error: 5,
  fatal: 6,
  uncaught: 7,
});

const f = r.bgBlue;
const b = r.green;
const h = r.yellow;
const v = r.red;
const y = r.cyan;

const w = {
  normal: (e) => f(`[${process.pid}]`) + " " + e,
  success: (e) => f(`[${process.pid}]`) + " " + b(e),
  failed: (e) => f(`[${process.pid}]`) + " " + v(e),
  info: (e) => f(`[${process.pid}]`) + " " + y(e),
  warn: (e) =>
    f(`[${process.pid}]`) + " " + h.inverse.bold("Warning:") + " " + h(e),
  error: (e) =>
    f(`[${process.pid}]`) + " " + v.inverse.bold("Error:") + " " + v(e),
  fatal: (e) =>
    f(`[${process.pid}]`) + " " + v.inverse.bold("Fatal Error:") + " " + v(e),
  uncaught: (e) =>
    f(`[${process.id}]`) +
    " " +
    v.inverse.bold("Uncaught Exception:") +
    " " +
    v(e),
};

a.on("window-all-closed", () => {});

a.on("before-quit", () => {
  e.Window.windows.forEach((e) => {
    e.forceClose();
  });
});

a.on("gpu-process-crashed", () => {
  console.log(r.red.inverse.bold("GPU Process Crashed!"));
});

a.on("ready", () => {
  if (e.App.beforeInit) {
    e.App.beforeInit(d);
  }

  let o = process.cwd();
  let l = process.argv.slice(1);
  for (let e = 0; e < l.length; ++e) {
    if (t.resolve(o, l[e]) === a.getAppPath()) {
      l.splice(e, 1);
      break;
    }
  }
  let c = d.parse(l);
  if (c.help) {
    a.quit();
    return;
  }
  let p = a.getLocale().substring(0, 2);

  if ("" !== c.lang) {
    p = c.lang;
  }

  s.remove(s.transports.Console);
  if (
    ("test" !== c._command)
  ) {
    n.ensureDirSync(t.dirname(c.logfile));
    if (n.existsSync(c.logfile)) {
      try {
        n.unlinkSync(c.logfile);
      } catch (e) {
        console.log(e);
      }
    }

    s.add(s.transports.File, {
      level: "uncaught",
      filename: c.logfile,
      json: false,
    });

    console.log(r.magenta("===== Initializing Editor ====="));
    let e = process.argv.slice(1);
    e = e.map((e) => `  ${e}`);
    console.log(r.magenta(`arguments: \n${e.join("\n")}\n`));
  }

  if (("test" !== c._command || c.detail)) {
    s.add(s.transports.Console, {
      level: "uncaught",
      formatter(e) {
        let o = "";

        if (void 0 !== e.message) {
          o += e.message;
        }

        if (e.meta &&
          Object.keys(e.meta).length) {
          o += " " + JSON.stringify(e.meta);
        }

        let r = w[e.level];
        return r ? r(o) : o;
      },
    });
  }

  e.argv = c;
  e.dev = c.dev;
  e.lang = p;
  e.logfile = c.logfile;
  e.Protocol.init(e);
  e.Package.lang = p;
  e.Package.versions = e.versions;
  e.Menu.showDev = c.dev;
  e.Debugger.debugPort = c.debug;
  e.Ipc.debug = c.dev;
  e.reset();

  i.series(
    [
      (o) => {
        if (!e.App.init) {
          e.error(
            "The `init` action was not found in your application. Please define it using the `Editor.App.Extend` function.           See https://github.com/cocos-creator/editor-framework/blob/master/docs/getting-started/define-your-app.md           for more information."
          );

          a.quit();
          return;
        }
        try {
          e.App.init(c, o);
        } catch (o) {
          e.error(o.stack || o);
          a.quit();
          return;
        }
      },
      (e) => {
        if (!c._command) {
          e();
          return;
        }
        if ("test" === c._command) {
          require("./lib/tester").run(c.path, c);
        } else {
          "build" === c._command;
        }
      },
      (o) => {
        e.log("Loading packages");
        e.loadAllPackages(o);
      },
      (o) => {
        e.log("Watching packages");
        e.watchPackages(o);
      },
      (o) => {
        e.log("Run Application");
        e.connectToConsole();

        if (c.dev && "win32" !== process.platform) {
          e.Debugger.startRepl();
        }

        if (!e.App.run) {
          e.error(
            '\n          The `run` action was not found in your application.\n          Please define it using the `Editor.App.Extend` function.\n          See "https://github.com/cocos-creator/editor-framework/blob/master/docs/getting-started/define-your-app.md" for more information.\n        '
          );

          a.quit();
          return;
        }
        try {
          e.App.run();
          o();
        } catch (o) {
          e.error(o.stack || o);
          a.quit();
          return;
        }
      },
    ],
    (o) => {
      if (o) {
        e.error(o.stack || o);
        a.quit();
      }
    }
  );
});

e.versions = {
    [a.getName()]: a.getVersion(),
    "editor-framework": m.version,
  };

e.frameworkPath = g;
module.exports = e;
