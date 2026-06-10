var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, i, t, n = t) => {
        var r = Object.getOwnPropertyDescriptor(i, t);

        if (
          !r ||
          (!("get" in r) ? !r.writable && !r.configurable : i.__esModule)
        ) {
          r = {
            enumerable: true,
            get() {
              return i[t];
            },
          };
        }

        Object.defineProperty(e, n, r);
      }
    : (e, i, t, n) => {
        e[(n = n === undefined ? t : n)] = i[t];
      });

var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? (e, i) => {
        Object.defineProperty(e, "default", { enumerable: true, value: i });
      }
    : (e, i) => {
        e.default = i;
      });

var __importStar =
  (this && this.__importStar) ||
  (() => {
    var r = (e) =>
      (r =
        Object.getOwnPropertyNames ||
        ((e) => {
          var i;
          var t = [];
          for (i in e) {
            if (Object.prototype.hasOwnProperty.call(e, i)) {
              t[t.length] = i;
            }
          }
          return t;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var i = {};
      if (e != null) {
        for (var t = r(e), n = 0; n < t.length; n++) {
          if (t[n] !== "default") {
            __createBinding(i, e, t[n]);
          }
        }
      }
      __setModuleDefault(i, e);
      return i;
    };
  })();

var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));

Object.defineProperty(exports, "__esModule", { value: true });
globalThis.DEBUG_TIME_COST = true;

if (DEBUG_TIME_COST) {
  console.time("Import files");
}

const index_1 = __importDefault(require("./engine/index"));
const scene_view_data_1 = require("../scene-view/scene-view-data");

if (DEBUG_TIME_COST) {
  console.timeEnd("Import files");
}

const LOCK = { engine: false, manager: false, config: false };
const layerMask = [];
for (let e = 0; e <= 19; e++) {
  layerMask[e] = 1 << e;
}
class StartupManager {
  async requireEngine() {
    if (!LOCK.engine) {
      LOCK.engine = true;
      Date.now();
      Editor.Metrics.trackTimeStart("[Scene] Require engine");
      await index_1.default.requireEngine();
      Editor.Metrics.trackTimeEnd("[Scene] Require engine", { output: true });
    }
  }
  async configEngine(e, i, t, n) {
    if (!LOCK.config) {
      LOCK.config = true;

      window.cce.Utils = {
        serialize: EditorExtends.serialize,
        deserializeFull: EditorExtends.deserializeFull,
      };

      Editor.Metrics.trackTimeStart("[Scene] Open engine");
      await index_1.default.openEngine(e);
      Editor.Metrics.trackTimeEnd("[Scene] Open engine", { output: true });
      Editor.Metrics.trackTimeStart("[Scene] Configure engine");
      await index_1.default.configureEngine();
      Editor.Metrics.trackTimeEnd("[Scene] Configure engine", { output: true });
      this.initCustomLayer(t);
      this.initSortingLayer(n);
      cc.game.canvas.requestPointerLock = () => {};
      cc.game.canvas.exitPointerLock = () => {};
      cc.game.canvas.requestFullscreen = () => {};
    }
  }
  async initEngine(e, i, t, n) {
    await this.requireEngine();
    await this.configEngine(e, i, t, n);
  }
  getDesignResolutionPolicy(e, i) {
    if (isPreviewProcess) {
      if (i) {
        if (e) {
          return cc.ResolutionPolicy.SHOW_ALL;
        }

        return cc.ResolutionPolicy.FIXED_HEIGHT;
      }

      if (e) {
        return cc.ResolutionPolicy.FIXED_WIDTH;
      }

      return cc.ResolutionPolicy.NO_BORDER;
    }

    return cc.ResolutionPolicy.SHOW_ALL;
  }
  async initDesignResolution() {
    var e = await Editor.Profile.getProject(
      "project",
      "general.designResolution"
    );
    if (!e) {
      throw new Error(
        'Failed to initialize design resolution: Unable to get project configuration from "project.general.designResolution"'
      );
    }
    let i = Number(e.width);
    let t = Number(e.height);
    var n = cc.view.getDesignResolutionSize();

    var n =
      (isNaN(i) && (i = n.width),
      isNaN(t) && (t = n.height),
      this.getDesignResolutionPolicy(e.fitWidth, e.fitHeight));

    cc.view.setDesignResolutionSize(i, t, n);

    if (
      scene_view_data_1.sceneViewData.targetDeviceName === "__default_design__"
    ) {
      scene_view_data_1.sceneViewData.targetResolution = {
        width: i,
        height: t,
      };
    }

    var e = cc.director.getScene();

    if (e) {
      e.getComponentsInChildren("cc.Canvas").forEach((e) => {
        if (
          !e.node.getComponent("cc.Widget") &&
          e.node.active &&
          e.enabled &&
          e.fitDesignResolution_EDITOR
        ) {
          e.fitDesignResolution_EDITOR();
        }
      });
    }
  }
  changeDesignResolution(e, i) {
    e -= 0;
    i -= 0;

    if (isNaN(e)) {
      e = cc.view._designResolutionSize.width;
    }

    if (isNaN(i)) {
      i = cc.view._designResolutionSize.height;
    }

    var t = cc.view.getResolutionPolicy();
    cc.view.setDesignResolutionSize(e, i, t);
  }
  async initCustomLayer(e) {
    if (e) {
      for (let e = 0; e <= 19; e++) {
        cc.Layers.deleteLayer(e);
      }
      e.forEach((i) => {
        var e = layerMask.findIndex((e) => i.value === e);

        if (-1 !== e) {
          cc.Layers.addLayer(i.name, e);
        }
      });
    }
  }
  async initSortingLayer(e) {
    if (Array.isArray(e)) {
      cc.settings.overrideSettings("engine", "sortingLayers", e);
      e = (await Promise.resolve().then(() => __importStar(require("cc"))))
        .SortingLayers;
      e.init();
    }
  }
  async initManager(e) {
    if (!LOCK.manager) {
      LOCK.manager = true;
      Editor.Metrics.trackTimeStart("[Scene] Init manager");
      module.paths.push(AppModulePath);
      await require("./init-manager").initManager();
      Editor.Metrics.trackTimeEnd("[Scene] Init manager", { output: true });
      cce.project = e.project;
    }
  }
}
exports.default = new StartupManager();
