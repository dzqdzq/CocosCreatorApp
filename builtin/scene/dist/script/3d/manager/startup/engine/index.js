var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, i, r = i) => {
        var n = Object.getOwnPropertyDescriptor(t, i);

        if (
          !n ||
          (!("get" in n) ? !n.writable && !n.configurable : t.__esModule)
        ) {
          n = {
            enumerable: true,
            get() {
              return t[i];
            },
          };
        }

        Object.defineProperty(e, r, n);
      }
    : (e, t, i, r) => {
        e[(r = r === undefined ? i : r)] = t[i];
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
          var i = [];
          for (t in e) {
            if (Object.prototype.hasOwnProperty.call(e, t)) {
              i[i.length] = t;
            }
          }
          return i;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var t = {};
      if (e != null) {
        for (var i = n(e), r = 0; r < i.length; r++) {
          if (i[r] !== "default") {
            __createBinding(t, e, i[r]);
          }
        }
      }
      __setModuleDefault(t, e);
      return t;
    };
  })();

Object.defineProperty(exports, "__esModule", { value: true });
exports.EngineStartup = undefined;

const { readJSON } = require("fs-extra");

const { join } = require("path");

const { importNativeEngine, importWebAdapter } = require("./adapter-util");

const requiredModules = [
  "cc",
  "cc/editor/populate-internal-constants",
  "cc/editor/serialization",
  "cc/editor/new-gen-anim",
  "cc/editor/embedded-player",
  "cc/editor/reflection-probe",
  "cc/editor/lod-group-utils",
  "cc/editor/material",
  "cc/editor/2d-misc",
  "cc/editor/offline-mappings",
  "cc/editor/custom-pipeline",
];

const Backends = {
  "physics-cannon": "cannon.js",
  "physics-ammo": "bullet",
  "physics-builtin": "builtin",
  "physics-physx": "physx",
};

const Backends2D = {
  "physics-2d-box2d": "box2d",
  "physics-2d-box2d-wasm": "box2d-wasm",
  "physics-2d-builtin": "builtin",
};

async function queryInternalAssetList() {
  var e = (await Editor.Message.request("engine", "query-engine-info"))
    .typescript.path;

  var t = await readJSON(join(e, "cc.config.json"));
  var i = [];
  for (const r in t.features) {
    if (t.features[r].dependentAssets) {
      i.push(...t.features[r].dependentAssets);
    }
  }
  return Array.from(new Set(i));
}
let cc;
class EngineStartup {
  nativeEngine = null;
  async loadNativeEngine() {
    var e = (await Editor.Message.request("engine", "query-engine-info"))
      .typescript.path;

    var t = ((await Editor.Profile.getConfig("scene", "scene.debug-native")) &&
      (await Editor.Dialog.warn(Editor.I18n.t("scene.messages.debug_native"), {
        detail: `process id: ${process.pid},isPreview:` + isPreviewProcess,
        buttons: [Editor.I18n.t("scene.messages.confirm")],
      })),
    (this.nativeEngine = await importNativeEngine(
      join(e, "bin/.editor/EngineAddon")
    )),
    importWebAdapter(join(e, "bin/.editor/web-adapter")),
    await Promise.resolve().then(() => __importStar(require("cc/preload"))))[
      "default"
    ];

    await t({
      dist: join(e, "bin/.editor"),
      requiredModules,
    });

    (cc = require("cc")).assetManager.downloader.appendTimeStamp = false;
    require(join(e, "bin/.editor/engine-adapter"));
    EditorExtends.start();

    setInterval(() => {
      this.nativeEngine?.tick();
    }, 3);
  }
  async requireEngine() {
    try {
      var e;

      if (isSceneNative) {
        await this.loadNativeEngine();
      } else {
        e = (
          await Promise.resolve().then(() =>
            __importStar(require("cc/preload"))
          )
        )["default"];

        await e({ requiredModules });
        cc = require("cc");
        EditorExtends.start();
      }
    } catch (e) {
      console.log("Load engine failed: " + e.message);
      throw e;
    }
  }
  async openEngine(e = {}) {
    var t = await queryInternalAssetList();

    var i =
      (await Editor.Message.request("engine", "query-engine-modules-profile"))
        ?.includeModules ?? [];

    var r = await Editor.Profile.getProject("project", "physics");
    var n = await Editor.Profile.getProject("engine", "macroConfig");
    var a = join(Editor.Project.tmpDir, "asset-db/effect/effect.bin");

    var t = {
      debugMode: cc.DebugMode.WARN,
      overrideSettings: {
        engine: { builtinAssets: t, macros: n },
        profiling: { showFPS: false },
        screen: { frameRate: 30 },
        rendering: {
          renderMode: 2,
          renderPipeline: await Editor.Profile.getProject(
            "project",
            "general.renderPipeline"
          ),
          effectSettingsPath: isSceneNative
            ? a
            : "file://" + a.replace(/\\/g, "/"),
          customPipeline: i.includes("custom-pipeline"),
        },
        physics: r,
        assets: {
          importBase: isSceneNative
            ? join(Editor.Project.path, "library")
            : "import://",
          nativeBase: isSceneNative
            ? join(Editor.Project.path, "library")
            : "import://",
        },
      },
      exactFitScreen: true,
    };

    if (t.overrideSettings.engine && e?.overrideSettings?.engine) {
      Object.assign(t.overrideSettings.engine, e.overrideSettings.engine);
    }

    if (isPreviewProcess) {
      isSceneNative
        ? ((n = (await Editor.Message.request("engine", "query-engine-info"))
            .typescript.path),
          (a = join(n, "bin/.editor")),
          await Editor.Message.request("preview", "write-setting-file", a),
          jsb.fileUtils.addSearchPath(a),
          (t.settingsPath = join(a, "src/settings.json")))
        : ((r = await Editor.Message.request("server", "query-port")),
          (e = `http://${await Editor.Message.request(
            "preview",
            "get-preview-ip"
          )}:${r}/game-view/`),
          (t.settingsPath = e + "settings.json"),
          (t.overrideSettings.assets.server = e));

      n = (
        await Editor.Message.request("asset-db", "query-assets", {
          isBundle: true,
        })
      ).map((e) => e.meta?.userData?.bundleName ?? e.name);

      t.overrideSettings.assets.remoteBundles = ["internal", "main"].concat(n);
    }

    cc.physics.selector.runInEditor = true;

    if (isPreviewProcess) {
      cc.cclegacy.GAME_VIEW = true;
    }

    try {
      var s = (
        await Promise.resolve().then(() =>
          __importStar(require("../../scripts"))
        )
      )["default"];
      cce.Script = s;
    } catch (e) {
      console.error(e);
    }
    await cc.game.init(t);
    await cc.game.run();
    let o = "builtin";
    let c = "builtin";

    i.forEach((e) => {
      if (e in Backends) {
        o = Backends[e];
      } else if (e in Backends2D) {
        c = Backends2D[e];
      }
    });

    cc.physics.selector.switchTo(o);
    cc.physics.PhysicsSystem.instance.enable = false;
    window.cc.internal.physics2d.selector.switchTo(c);
    cce.NativeScene?.sendToBrowser("onEngineReady", isPreviewProcess);
  }
  async configureStartup() {}
  configureEngine() {}
  async loadEffect() {
    const t = (
      await Promise.resolve().then(() => __importStar(require("../../effects")))
    )["default"];
    var e = await cce.Ipc.send("query-effects");
    await Promise.all(e.map((e) => t.registerEffect(e)));
  }
}
const engineStartup = new (exports.EngineStartup = EngineStartup)();
exports.default = engineStartup;
