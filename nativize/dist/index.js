Object.defineProperty(exports, "__esModule", { value: true });

exports.NativizeConstants = undefined;
exports.Nativize = undefined;
exports.initNativize = undefined;

const electron_1 = require("electron");
const native_manager_1 = require("./native-manager");

Object.defineProperty(exports, "Nativize", {
  enumerable: true,
  get() {
    return native_manager_1.Nativize;
  },
});

Object.defineProperty(exports, "NativizeConstants", {
  enumerable: true,
  get() {
    return native_manager_1.NativizeConstants;
  },
});

const ipc = require("@base/electron-base-ipc");

let initLimitTimes = 5;
let mainWindow = null;
let sceneWindow = null;
let isEngineViewReady = false;
let isNativeWindowReady = false;
const isWin32 = process.platform === "win32";
let redrawHandle = null;
function onNativize() {
  native_manager_1.Nativize.on("resize", (e, i) => {
    if (isWin32) {
      mainWindow.setBounds({ x: 0, y: 0, width: e, height: i });
    } else {
      mainWindow.setBounds({ width: e, height: i });
    }
  });

  native_manager_1.Nativize.on("close", () => {
    mainWindow.close();
  });

  native_manager_1.Nativize.on("focus", () => {
    mainWindow.focus();
  });

  native_manager_1.Nativize.on("redraw", () => {
    if (redrawHandle) {
      clearTimeout(redrawHandle);
      redrawHandle = null;
    }

    redrawHandle = setTimeout(() => {
      if (sceneWindow) {
        sceneWindow.resize({
          w: native_manager_1.Nativize.mainSceneWidth - 1,
          h: native_manager_1.Nativize.mainSceneHeight - 1,
        });

        sceneWindow.resize({
          w: native_manager_1.Nativize.mainSceneWidth,
          h: native_manager_1.Nativize.mainSceneHeight,
        });
      }
    }, 30);
  });

  native_manager_1.Nativize.on("connect", (e) => {
    console.log("native app suc connected, first time:" + e);

    if (e) {
      initSceneWindow();
      setNativeWindowReady(true);
    }
  });
}
function initMainWindow() {
  var { width, height } = mainWindow.getBounds();
  native_manager_1.Nativize.init(
    mainWindow.getNativeWindowHandle(),
    width,
    height
  );
  native_manager_1.Nativize.setMinWindowSize(960, 680);
  mainWindow.focus();
}
async function prepareNativeEngine(n) {
  return new Promise((i, e) => {
    native_manager_1.Nativize.request({
      type: "prepareNativeEngine",
      data: { editorPath: n },
    }).then((e) => {
      i(true);
    });
  });
}
function initSceneWindow() {
  native_manager_1.Nativize.createWindow(480, 320).then((e) => {
    console.log("scene-resize", "createWindow");
    sceneWindow = e;
  });
}
function setEngineViewReady(e) {
  if ((isEngineViewReady = e) && isNativeWindowReady) {
    prepareNativeEngine(Editor.App.path);
  }
}
function setNativeWindowReady(e) {
  isNativeWindowReady = e;

  if (isEngineViewReady && isNativeWindowReady) {
    prepareNativeEngine(Editor.App.path).then(() => {
      if (native_manager_1.Nativize.mainSceneWidth !== 0 && sceneWindow) {
        console.log(
          "prepareNativeEngine  scene-resize",
          native_manager_1.Nativize.mainSceneWidth,
          native_manager_1.Nativize.mainSceneHeight
        );

        sceneWindow.resize({
          w: native_manager_1.Nativize.mainSceneWidth,
          h: native_manager_1.Nativize.mainSceneHeight,
        });
      }
    });
  }
}
async function initNativize(e) {
  if ((mainWindow = e.uuid2win[e.uuids[0]])) {
    initMainWindow();
    onNativize();

    ipc.on("engine-view:ready", (e, i) => {
      setEngineViewReady(i);
    });

    ipc.on("editor-lib-windows:scene-resize", (e, i) => {
      if (i && i.width) {
        electron_1.BrowserWindow.fromWebContents(e.sender) &&
          sceneWindow &&
          ((e = mainWindow.getContentSize()),
          sceneWindow.resize({
            x: i.left,
            y: isWin32 ? i.top : e[1] - i.bottom,
            w: i.width,
            h: i.height,
          }));

        native_manager_1.Nativize.setMainWindowSize(i.width, i.height);
      }
    });

    Editor.Message.addBroadcastListener("editor-title-change", (e) => {
      native_manager_1.Nativize.setTitle(e);
    });
  } else if (initLimitTimes > 0) {
    setTimeout(() => {
      initLimitTimes--;
      initNativize(e);
    }, 1000 /* 1e3 */);
  }
}
exports.initNativize = initNativize;
