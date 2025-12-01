"use strict";
let Debugger = {};
module.exports = Debugger;
const Electron = require("electron");
const ChildProcess = require("child_process");
const Repl = require("repl");
const MainMenu = require("./main-menu");
const i18n = require("./i18n");
const Chalk = require("chalk");
const Console = require("./console");
let _replServer = null;
let _nodeInspector = null;
let _dbgPort = 3030;
function _eval(cmd, context, filename, callback) {
  try {
    let result = eval(cmd);
    callback(null, result);
  } catch (e) {
    console.log(Chalk.red(e.stack));
  }
}

Debugger.toggleRepl = function () {
  if (_replServer) {
    Debugger.stopRepl();
  } else {
    Debugger.startRepl();
  }

  return null !== _replServer;
};

Debugger.startRepl = function () {
  let e = i18n.formatPath(
    "i18n:MAIN_MENU.developer.title/i18n:MAIN_MENU.developer.toggle_repl"
  );

  _replServer = Repl.start({ prompt: "editor$ > ", eval: _eval }).on(
    "exit",
    () => {
      console.info("Repl debugger closed");
      _replServer = null;
      MainMenu.set(e, { checked: false });
    }
  );

  MainMenu.set(e, { checked: true });
};

Debugger.stopRepl = function () {
  if (_replServer) {
    _replServer.write(".exit\n");
  }
};

Debugger.toggleNodeInspector = function () {
  if (_nodeInspector) {
    Debugger.stopNodeInspector();
  } else {
    Debugger.startNodeInspector();
  }

  return null !== _nodeInspector;
};

Debugger.startNodeInspector = function () {
  let e = Electron.app.getPath("exe");

  let r = i18n.formatPath(
    "i18n:MAIN_MENU.developer.title/i18n:MAIN_MENU.developer.toggle_node_inspector"
  );

  let t = `http://127.0.0.1:8080/debug?ws=127.0.0.1:8080&port=${_dbgPort}`;
  try {
    _nodeInspector = ChildProcess.spawn(
      e,
      [
        "node_modules/node-inspector/bin/inspector.js",
        `--debug-port=${_dbgPort}`,
      ],
      { stdio: "inherit", env: { ELECTRON_RUN_AS_NODE: true } }
    );

    MainMenu.set(r, { checked: true });

    _nodeInspector.on("close", () => {
      _nodeInspector = null;
      MainMenu.set(r, { checked: false });
      Console.info("node-inspector stopped");
    });
  } catch (e) {
    Console.failed(`Failed to start node-inspector: ${e.message}`);
    _nodeInspector = null;
    return;
  }
  Console.info(`node-inspector started: ${t}`);
};

Debugger.stopNodeInspector = function () {
  if (_nodeInspector) {
    _nodeInspector.kill();
  }
};

Debugger.activeDevtron = function () {
    try {
      Electron.BrowserWindow.addDevToolsExtension(require("devtron").path);
    } catch (e) {
      Console.error(`Failed to activate devtron: ${e.message}`);
    }
  };

Object.defineProperty(Debugger, "debugPort", {
  enumerable: true,
  get: () => _dbgPort,
  set(e) {
    _dbgPort = e;
  },
});

Object.defineProperty(Debugger, "isReplEnabled", {
  enumerable: true,
  get: () => null !== _replServer,
});

Object.defineProperty(Debugger, "isNodeInspectorEnabled", {
  enumerable: true,
  get: () => null !== _nodeInspector,
});
