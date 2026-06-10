Object.defineProperty(exports, "__esModule", { value: true });
const Chroma = require("chroma-js");
let isStart = false;
let isFinish = false;
let isEnd = false;
let currProgress = 0;
let bakerSum = 20;
let progress = 0;
let logInfos = [];
let currPath;
function initVal() {
  currProgress = 0;
  bakerSum = 20;
  progress = 0;
}
function changeProgress(e = null, o = true) {
  if (!e) {
    (currProgress += 10) >= bakerSum - 10 && (bakerSum += 10);
    e = (currProgress / bakerSum) * 100;
    o && (e /= 2);
  }

  progress = e;
}
const methods = {
  async open() {
    if (await Editor.Profile.getConfig("lightmap", "laboratory.bake_feature")) {
      isStart = false;
      logInfos = [];
      Editor.Panel.open("lightmap.panel");
    } else {
      Editor.Dialog.warn(Editor.I18n.t("lightmap.openWarn"));
    }
  },
  async start() {
    console.debug("Light map panel output info: start.");
    isStart = true;
    isFinish = false;
    isEnd = false;
    (logInfos = []).push("Baking started");
  },
  cancel() {
    isEnd = true;
    initVal();
  },
  log(e) {
    console.debug("Light map panel output info: log.", e);
    logInfos.push(e);

    if (isFinish) {
      changeProgress(null, false);
    }
  },
  progress(e) {
    console.debug("Light map panel output info: progress.", e);
    logInfos.push(e);

    if (!isFinish) {
      changeProgress();
    }
  },
  finished() {
    console.debug("Light map panel output info: finished.");
    isFinish = true;
    isEnd = false;

    logInfos.push(
      "The baking is ready to complete and begin generating images."
    );

    changeProgress(50);
  },
  async end() {
    console.debug("light map panel output info: end.");
    isEnd = true;
    logInfos.push("End of the baking.");
    logInfos.push(Editor.I18n.t("lightmap.end"));
    initVal();
  },
  async clear() {
    console.debug("Light map panel output info: clear.");
    logInfos = [];
    isStart = false;
    isFinish = false;
    isEnd = false;
    initVal();
    currPath = "";
  },
  async unstaging() {
    return {
      progress,
      logInfos,
      currPath,
      isStart,
      isFinish,
      isEnd,
    };
  },
  async savePicPath(e) {
    currPath = Editor.Utils.Path.normalize(e);
  },
  async getConfig() {
    let e = await Editor.Profile.getConfig("lightmap", "lightmap");

    if (
      typeof (e = e || {
        msaa: 4,
        path: "",
        size: 1024,
        highp: false,
        giScale: 1,
        giSamples: 25,
        giPathLength: 4,
        aoLevel: 0,
        aoStrength: 0.5,
        aoRadius: 1,
        aoColor: [136, 136, 136, 255],
        tab: 0,
        r: true,
        g: true,
        b: true,
        a: false,
        filter: true,
      }).aoColor == "string"
    ) {
      e.aoColor = Chroma(e.aoColor).rgb();
    }

    return e;
  },
  bakeLightProbe(e) {
    Editor.Message.send("scene", "execute-scene-script", {
      name: "lightmap",
      method: "bakeLightProbe",
      args: [e, Editor.App.path],
    });
  },
  cancelLightProbe() {
    Editor.Message.send("scene", "execute-scene-script", {
      name: "lightmap",
      method: "cancelLightProbe",
      args: [],
    });
  },
};
async function load() {}
function unload() {}
exports.load = load;
exports.methods = methods;
exports.unload = unload;
