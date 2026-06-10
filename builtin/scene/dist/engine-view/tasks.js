Object.defineProperty(exports, "__esModule", { value: true });

const {
  outputFileSync,
  readdirSync,
  removeSync,
  readJSON,
} = require("fs-extra");

const join = require("path").join;
class Tasks {
  $scene;
  _dump = null;
  _timer = null;
  _softOpen = false;
  tmpDir = join(Editor.Project.tmpDir, "./scene/staging");
  tmpTimers = {};
  stagingDump(r, a) {
    if (r) {
      clearTimeout(this.tmpTimers[r]);

      this.tmpTimers[r] = setTimeout(() => {
        for (
          var e = new Date(),
            t = [e.getFullYear(), e.getMonth() + 1, e.getDate()].join(""),
            e = [e.getHours(), e.getMinutes(), e.getSeconds()]
              .map((e) => ("0" + e).substr(-2))
              .join(""),
            i = join(this.tmpDir, r),
            t = join(i, t + " " + e + ".json"),
            n =
              (outputFileSync(t, JSON.stringify(JSON.parse(a))),
              readdirSync(i));
          n.length > 5;

        ) {
          var s = n.shift();
          removeSync(join(i, s));
        }
      }, 60000 /* 6e4 */);
    }
  }
  updateDump(e = undefined) {
    if (e) {
      this._dump = e;
    } else {
      this.$scene.ipc.isReady;
    }
  }
  editorInit = ["editor-init", { depends: [], async handle() {} }];
  assetDbReady = [
    "asset-db-ready",
    {
      depends: [],
      async handle() {
        return Editor.Message.request("asset-db", "query-ready");
      },
    },
  ];
  queryEngineInfo = [
    "query-engine-info",
    {
      depends: [],
      async handle() {
        return (await Editor.Message.request("engine", "query-engine-info"))
          .typescript;
      },
    },
  ];
  webviewReady = [
    "webview-ready",
    {
      depends: [],
      handle: async () => {
        this.$scene.depend.finish("webview-ready");
        this.$scene.ipc.setReady(true);
      },
      reset: async () => {
        Editor.Message.broadcast("scene:close");
        this._softOpen = true;
        this.$scene.ipc.setReady(false);
      },
    },
  ];
  webviewEngineInit = [
    "webview-engine-init",
    {
      depends: [
        "asset-db-ready",
        "query-engine-info",
        "webview-ready",
        "packer-driver-ready",
      ],
      handle: async () => {
        try {
          var e = await Editor.Profile.getProject("project", "layer");

          var t =
            (await Editor.Profile.getProject("project", "sorting-layer")) || {};

          var i = await Editor.Profile.getProject(
            "project",
            "general.renderPipeline"
          );

          await this.$scene.ipc.send("call-method", {
            module: "Startup",
            handler: "initEngine",
            params: [this.$scene.info, i, e, t.layers || []],
            queue: false,
            timeout: false,
          });

          await this.$scene.ipc.send("call-method", {
            module: "Startup",
            handler: "initDesignResolution",
            params: [],
            queue: false,
            timeout: false,
          });

          Editor.Message.send("scene", "change-target-resolution");
        } catch (e) {
          console.error(e);
        }
        this.$scene.depend.finish("webview-engine-init");
      },
    },
  ];
  webviewManagerInit = [
    "webview-manager-init",
    {
      depends: ["webview-engine-init"],
      handle: async () => {
        try {
          Editor.Metrics.trackTimeStart("[Metrics]open scene first time");

          await this.$scene.ipc.send("call-method", {
            module: "Startup",
            handler: "initManager",
            params: [
              Object.assign(this.$scene.info, {
                project: Editor.Project.path,
              }),
            ],
            queue: false,
            timeout: false,
          });

          await this.$scene.ipc.send("call-method", {
            module: "Ipc",
            handler: "startup",
            params: [],
            queue: false,
            timeout: false,
          });

          var e =
            (
              await Editor.Message.request(
                "engine",
                "query-engine-modules-profile"
              )
            )?.includeModules ?? [];

          if (e && !e.includes("3d")) {
            this.$scene.callSceneMethod("changeProjectMode", ["2d"], true);
          }

          var t = await Editor.Profile.getProject(
            "project",
            "general.highQuality"
          );

          if (t) {
            this.$scene.callSceneMethod("changeHighQuality", [t], true);
          }

          this.$scene.managerReady = true;

          Editor.Metrics.trackTimeEnd("[Metrics]open scene first time", {
            output: true,
          });
        } catch (e) {
          console.error(e);
        }
        this.$scene.setSceneManagerReady(true);
        this.$scene.depend.finish("webview-manager-init");
      },
      reset: async () => {
        this.$scene.managerReady = false;
      },
    },
  ];
  packerDriverReady = [
    "packer-driver-ready",
    {
      depends: [],
      handle: async () => {
        var e = await Editor.Message.request(
          "programming",
          "packer-driver/ready",
          "editor"
        );

        if (e) {
          console.debug("Packer is ready. Immediately do first execution.");
        } else {
          console.debug(
            "Packer is not ready. Yield to wait for its completion."
          );
        }

        return e;
      },
    },
  ];
  autoOpenScene = [
    "auto-open-scene",
    {
      depends: ["editor-init", "webview-manager-init"],
      handle: async () => {
        let e = (await Editor.Profile.getTemp("scene", "current-scene")) || "";

        e =
          e ||
          (await Editor.Profile.getProject("scene", "current-scene")) ||
          "";

        await this.$scene.callSceneMethod("openScene", [e]);
        this.$scene.depend.finish("auto-open-scene");

        if (this._softOpen && this._dump) {
          await this.$scene.callSceneMethod("restoreAllScenes", [this._dump]);

          this._softOpen = false;
        }
      },
    },
  ];
}
exports.default = new Tasks();
