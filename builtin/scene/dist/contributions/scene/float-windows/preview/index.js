var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, r, i = r) => {
        var n = Object.getOwnPropertyDescriptor(t, r);

        if (
          !n ||
          (!("get" in n) ? !n.writable && !n.configurable : t.__esModule)
        ) {
          n = {
            enumerable: true,
            get() {
              return t[r];
            },
          };
        }

        Object.defineProperty(e, i, n);
      }
    : (e, t, r, i) => {
        e[(i = i === undefined ? r : i)] = t[r];
      });

var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? (e, t) => {
        Object.defineProperty(e, "default", { enumerable: true, value: t });
      }
    : (e, t) => {
        e.default = t;
      });

var __importStar =
  (this && this.__importStar) ||
  (() => {
    var n = (e) =>
      (n =
        Object.getOwnPropertyNames ||
        ((e) => {
          var t;
          var r = [];
          for (t in e) {
            if (Object.prototype.hasOwnProperty.call(e, t)) {
              r[r.length] = t;
            }
          }
          return r;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var t = {};
      if (e != null) {
        for (var r = n(e), i = 0; i < r.length; i++) {
          if (r[i] !== "default") {
            __createBinding(t, e, r[i]);
          }
        }
      }
      __setModuleDefault(t, e);
      return t;
    };
  })();

Object.defineProperty(exports, "__esModule", { value: true });

exports.default = undefined;
exports.template = undefined;
exports.mode = undefined;
exports.dock = undefined;
exports.right = undefined;
exports.bottom = undefined;
exports.height = undefined;
exports.width = undefined;
exports.type = undefined;

exports.ready = ready;
exports.close = close;
exports.send = send;

const { readFileSync } = require("fs");

const { join } = require("path");

const ElectronModule = require("@base/electron-module");
const GlPreview = ElectronModule.require("PreviewExtends").default;
const glPreview = new GlPreview(
  "scene:mini-preview",
  "query-mini-preview-data"
);
exports.type = "cc.Camera";
exports.width = 200;
exports.height = 100;
exports.bottom = 10;
exports.right = 10;
exports.dock = true;
exports.mode = "simple";
let currWidth;
let currHeight;
let toolbars;
let cameraPreview;
let canvasContain;
let canvas;
let panel;
let miniPreviewInfo;
let previewInfo;
let $scene;
let frameId;
let curCameraUUID = "";
async function applyWindowSize() {
  if (canvas) {
    previewInfo && previewInfo.width && previewInfo.height
      ? ((currHeight = $scene.clientHeight / 4),
        (currWidth = currHeight * (previewInfo.width / previewInfo.height)) >=
          $scene.clientWidth / 2 &&
          ((currWidth = $scene.clientWidth / 2),
          (currHeight = currWidth / (previewInfo.width / previewInfo.height))))
      : ((currHeight = $scene.clientHeight / 4), (currWidth = 2 * currHeight));

    currWidth |= 0;
    currHeight |= 0;
    panel.style.height = currHeight + "px";
    panel.style.width = currWidth + "px";
    panel.style.setProperty("--float-window-width", currWidth + "px");
    panel.style.setProperty("--float-window-height", currHeight + "px");
    canvasContain.style.width = currWidth + "px";
    canvasContain.style.height = currHeight + "px";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.width = currWidth;
    canvas.height = currHeight;
    glPreview.resizeGL(currWidth, currHeight);
    await send("cameraUpdate");
  }
}
async function callMiniPreviewFunction(e, ...t) {
  return $scene.callSceneMethod("callPreviewFunction", [
    "scene:mini-preview",
    e,
    t,
  ]);
}
async function ready(e, t, r) {
  $scene = e.parentElement;
  (panel = e).style.opacity = "1";
  panel.hidden = true;

  if (t.nodes.length <= 1 && r[exports.type]) {
    if (r[exports.type][0].enabled) {
      await callMiniPreviewFunction(
        "handleSelect",
        (curCameraUUID = r[exports.type][0].uuid)
      );

      canvasContain = panel.querySelector(".canvas-contain");
      canvas = panel.querySelector("canvas");

      (toolbars = panel.querySelector("ui-panel")) &&
        toolbars.setAttribute(
          "src",
          join(__dirname, "./toolbars/camera-size.js")
        );

      cameraPreview = panel.querySelector("camera-preview");
      previewInfo = await callMiniPreviewFunction("getPreviewInfo");
      await applyWindowSize();
      $scene.$scene.getWebContentsId();

      canvas &&
        (await glPreview.init({
          width: canvas.width,
          height: canvas.height,
        }),
        await glPreview.initGL(canvas),
        await applyWindowSize(),
        await send("cameraUpdate"),
        (panel.hidden = false));
    } else {
      e.hidden = true;
    }
  }
}
async function close() {
  glPreview.destroyGL();
  await callMiniPreviewFunction("handleUnselect", curCameraUUID);
}
function drawBuffer(e) {
  try {
    glPreview.drawGL(e);
  } catch (e) {
    console.warn(e);
  }
}
async function send(e) {
  if (e !== "cameraUpdate") {
    if (e === "viewResize") {
      await applyWindowSize();
    } else if (e && e.name && e.name === "preview-plugin") {
      previewInfo = e;
      await applyWindowSize();
    }

    return true;
  }
  {
    const e = await glPreview.queryPreviewData({
      width: canvas.width,
      height: canvas.height,
    });
    return !e || e instanceof Uint8Array ? false : (drawBuffer(e), true);
  }
}

exports.template = readFileSync(join(__dirname, "./index.html"), "utf-8");

exports.default = __importStar(require("./index"));
